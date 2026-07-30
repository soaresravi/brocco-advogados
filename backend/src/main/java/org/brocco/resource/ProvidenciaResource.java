package org.brocco.resource;

import org.brocco.dto.request.*;
import org.brocco.dto.response.*;
import org.brocco.entity.*;
import org.brocco.enums.*;
import org.brocco.service.*;
import org.brocco.util.ErroResponse;

import jakarta.annotation.security.RolesAllowed;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Path("/providencias")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class ProvidenciaResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;

    @Inject
    NotificacaoService notificacaoService; 

    @Context
    HttpHeaders httpHeaders;

    @Context
    UriInfo uriInfo;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    private String getUserAgent() {
        return httpHeaders.getHeaderString("User-Agent");
    }

    private String getClientIp() {

        String ip = httpHeaders.getHeaderString("X-Forwarded-For");

        if (ip != null && !ip.isEmpty()) {
            return ip.split(",")[0].trim();
        }

        ip = httpHeaders.getHeaderString("X-Real-IP");

        if (ip != null && !ip.isEmpty()) {
            return ip;
        }

        return null;

    }

    private Long getAdminId() {
        User currentUser = User.findById(getUserId());
        return currentUser.adminId != null ? currentUser.adminId : currentUser.id;
    }

    private boolean canEdit() {
        User user = User.findById(getUserId());
        return user.permissao == Permissao.ADMIN || user.permissao == Permissao.EDIT;
    }

    @GET
    @Path("/clientes/buscar")

    public Response buscarClientes(@QueryParam("search") String search, @QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size) {

        Long adminId = getAdminId();

        if (search == null || search.trim().isEmpty()) {
            return Response.ok(new PageResponse<>(new ArrayList<>(), 0, page, size)).build();
        }

        StringBuilder query = new StringBuilder("adminId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(adminId);

        query.append(" and (lower(nome) like ?").append(params.size() + 1);
        params.add("%" + search.toLowerCase() + "%");
        query.append(" or matriculaSap like ?").append(params.size() + 1);
        params.add("%" + search + "%");
        query.append(" or numeroProcesso like ?").append(params.size() + 1);
        params.add("%" + search + "%");
        query.append(")");

        query.append(" order by nome asc");
        long total = Cliente.find(query.toString(), params.toArray()).count();

        List<Cliente> clientes = Cliente.find(query.toString(), params.toArray()).page(page, size).list();
        
        List<Map<String, Object>> response = clientes.stream().map(c -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", c.id);
            map.put("nome", c.nome);
            map.put("cpf", c.cpf);
            map.put("matriculaSap", c.matriculaSap);
            map.put("regimePrisional", c.regimePrisional);
            map.put("numeroProcesso", c.numeroProcesso);
            map.put("unidadePrisional", c.unidadePrisional);

            return map;

        }).collect(Collectors.toList());

        return Response.ok(new PageResponse<>(response, total, page, size)).build();

    }

    @GET

    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("clienteId") Long clienteId, @QueryParam("status") String status, @QueryParam("search") String search) {

        Long adminId = getAdminId();

        StringBuilder query = new StringBuilder("adminId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(adminId);

        if (clienteId != null) {
            query.append(" and cliente.id = ?").append(params.size() + 1);
            params.add(clienteId);
        }

        if (status != null && !status.isEmpty()) {

            try {
                StatusProvidencia statusEnum = StatusProvidencia.valueOf(status.toUpperCase());
                query.append(" and status = ?").append(params.size() + 1);
                params.add(statusEnum);
            } catch (IllegalArgumentException e) {
                System.out.println("error");
            }

        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(cliente.nome) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or cliente.matriculaSap like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(" or lower(observacoes) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(")");
        }

        query.append(" order by dataAtendimento desc, id desc");
        long total = Providencia.find(query.toString(), params.toArray()).count();

        List<Providencia> lista = Providencia.find(query.toString(), params.toArray()).page(page, size).list();
        List<ProvidenciaResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());

        return Response.ok(new PageResponse<>(responseList, total, page, size)).build();

    }

    @GET
    @Path("/{id}")
    
    public Response buscar(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        Providencia entity = Providencia.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Providência não encontrada", uriInfo.getPath())).build();
        }

        return Response.ok(toResponse(entity)).build();

    }

    @POST
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response criar(@Valid ProvidenciaRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para criar providências", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Cliente cliente = Cliente.find("id = ?1 and adminId = ?2", request.clienteId, adminId).firstResult();

        if (cliente == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Cliente não encontrado", uriInfo.getPath())).build();
        }

        if (request.enviarParaId != null) {

            User user = User.findById(request.enviarParaId);

            if (user == null || !user.adminId.equals(adminId)) {
                return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Usuário para notificação não encontrado", uriInfo.getPath())).build();
            }
            
        }

        if (request.distribuirParaId != null) {

            User user = User.findById(request.distribuirParaId);

            if (user == null || !user.adminId.equals(adminId)) {
                return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Usuário para tarefa não encontrado", uriInfo.getPath())).build();
            }

        }

        Providencia entity = new Providencia();

        entity.adminId = adminId;
        entity.cliente = cliente;
        entity.dataAtendimento = request.dataAtendimento != null ? request.dataAtendimento : LocalDate.now();
        entity.status = request.status != null ? request.status : StatusProvidencia.PENDENTE;
        entity.itens = request.itens != null ? request.itens : new ArrayList<>();
        entity.observacoes = request.observacoes;
        entity.enviarParaId = request.enviarParaId;
        entity.distribuirParaId = request.distribuirParaId;

        entity.persist();

        if (request.enviarParaId != null && !request.enviarParaId.equals(getUserId())) {
            String itensDesc = entity.itens != null ? entity.itens.stream().map(TipoProvidencia::getDescricao).collect(Collectors.joining(", ")) : "";
            notificacaoService.criar(request.enviarParaId, getUserId(), TipoNotificacao.MENSAGEM, "Nova providência registrada", "Cliente: " + cliente.nome + "\nItens: " + itensDesc + "\n" + (entity.observacoes != null ? entity.observacoes : ""), entity.id, "Providencia", "/andamentos/clientes/" + cliente.id);
        }

        if (request.distribuirParaId != null && !request.distribuirParaId.equals(getUserId())) {
            notificacaoService.criar(request.distribuirParaId, getUserId(), TipoNotificacao.TAREFA_PENDENTE, "Nova tarefa distribuída", "Providência para cliente: " + cliente.nome + "\nItens: " + (entity.itens != null ? entity.itens.stream().map(TipoProvidencia::getDescricao).collect(Collectors.joining(", ")) : ""), entity.id, "Providencia", "/andamentos/clientes/" + cliente.id);
        }

        logService.registrar(getUserId(),"CREATE","Providência", entity.id, "Criou providência para cliente: " + cliente.nome + " com " + entity.itens.size() + " itens", getClientIp(), getUserAgent());
        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();
    
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response atualizar(@PathParam("id") Long id, @Valid ProvidenciaRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para editar providências", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Providencia entity = Providencia.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Providência não encontrada", uriInfo.getPath())).build();
        }

        if (request.clienteId != null && !request.clienteId.equals(entity.cliente.id)) {

            Cliente cliente = Cliente.find("id = ?1 and adminId = ?2", request.clienteId, adminId).firstResult();

            if (cliente == null) {
                return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Cliente não encontrado", uriInfo.getPath())).build();
            }

            entity.cliente = cliente;

        }

        entity.dataAtendimento = request.dataAtendimento != null ? request.dataAtendimento : entity.dataAtendimento;
        entity.status = request.status != null ? request.status : entity.status;
        entity.itens = request.itens != null ? request.itens : entity.itens;
        entity.observacoes = request.observacoes;
        entity.enviarParaId = request.enviarParaId;
        entity.distribuirParaId = request.distribuirParaId;

        entity.persist();
        logService.registrar(getUserId(),"UPDATE","Providência", entity.id, "Atualizou providência do cliente: " + entity.cliente.nome, getClientIp(), getUserAgent());
        return Response.ok(toResponse(entity)).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response deletar(@PathParam("id") Long id) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para excluir providências", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Providencia entity = Providencia.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Providência não encontrada", uriInfo.getPath())).build();
        }

        String clienteNome = entity.cliente.nome;
        int qtdItens = entity.itens.size();

        entity.delete();
        logService.registrar(getUserId(),"DELETE","Providência", id, "Excluiu providência do cliente: " + clienteNome + " com " + qtdItens + " itens", getClientIp(), getUserAgent());
        return Response.noContent().build();

    }

    private ProvidenciaResponse toResponse(Providencia entity) {

        ProvidenciaResponse response = new ProvidenciaResponse();
        
        response.id = entity.id;
        response.clienteId = entity.cliente.id;
        response.clienteNome = entity.cliente.nome;
        response.clienteMatriculaSap = entity.cliente.matriculaSap;
        response.dataAtendimento = entity.dataAtendimento;
        response.status = entity.status;
        response.itens = entity.itens;
        response.observacoes = entity.observacoes;
        response.enviarParaId = entity.enviarParaId;
        response.distribuirParaId = entity.distribuirParaId;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;

        if (entity.enviarParaId != null) {
            User user = User.findById(entity.enviarParaId);
            response.enviarParaNome = user != null ? user.nome : null;
        }

        if (entity.distribuirParaId != null) {
            User user = User.findById(entity.distribuirParaId);
            response.distribuirParaNome = user != null ? user.nome : null;
        }
        
        return response;

    }
}