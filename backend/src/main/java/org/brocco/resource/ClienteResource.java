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
import java.util.List;
import java.util.stream.Collectors;

@Path("/clientes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class ClienteResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;

    @Context
    UriInfo uriInfo;

    @Context
    HttpHeaders httpHeaders;

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

    private String getFaixaEtaria(LocalDate dataNascimento) {

        if (dataNascimento == null) return "Não informado";
        int idade = java.time.Period.between(dataNascimento, java.time.LocalDate.now()).getYears();

        if (idade < 18) return "0-17";
        if (idade <= 25) return "18-25";
        if (idade <= 35) return "26-35";
        if (idade <= 45) return "36-45";
        if (idade <= 59) return "46-59";

        return "60+";

    }

    @GET

    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("search") String search, @QueryParam("regime") RegimePrisional regime) {

        Long adminId = getAdminId();

        StringBuilder query = new StringBuilder("adminId = ?1");
        List<Object> params = new java.util.ArrayList<>();

        params.add(adminId);

        if (search != null && !search.isEmpty()) {
            query.append(" and (nome like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(" or matriculaSap like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(" or cpf like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(" or numeroProcesso like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(")");
        }

        if (regime != null) {
            query.append(" and regimePrisional = ?").append(params.size() + 1);
            params.add(regime);
        }

        query.append(" order by nome asc");
        long total = Cliente.find(query.toString(), params.toArray()).count();

        List<Cliente> clientes = Cliente.find(query.toString(), params.toArray()).page(page, size).list();
        List<ClienteResponse> responses = clientes.stream().map(this::toResponse).collect(Collectors.toList());

        return Response.ok(new PageResponse<>(responses, total, page, size)).build();
        
    }

    @GET
    @Path("/{id}")

    public Response buscar(@QueryParam("id") Long id) {

        Long adminId = getAdminId();
        Cliente cliente = Cliente.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (cliente == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Cliente não encontrado", uriInfo.getPath())).build();
        }

        return Response.ok(toResponse(cliente)).build();

    }

    @POST
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response criar(@Valid ClienteRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para criar clientes", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Cliente cliente = new Cliente();
        cliente.adminId = adminId;
        updateEntity(cliente, request);
        
        cliente.persist();
        logService.registrar(getUserId(),"CREATE","Cliente", cliente.id, "Criou cliente: " + cliente.nome + " (CPF: " + (cliente.cpf != null ? cliente.cpf : "não informado") + ")", getClientIp(), getUserAgent());
        return Response.status(Response.Status.CREATED).entity(toResponse(cliente)).build();
    
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response atualizar(@PathParam("id") Long id, @Valid ClienteRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para editar clientes", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Cliente cliente = Cliente.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (cliente == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Cliente não encontrado", uriInfo.getPath())).build();
        }

        String nomeAntigo = cliente.nome;
        updateEntity(cliente, request);

        cliente.persist(); logService.registrar(getUserId(),"UPDATE","Cliente", cliente.id, "Atualizou cliente: " + nomeAntigo + " -> " + cliente.nome, getClientIp(), getUserAgent());
        return Response.ok(toResponse(cliente)).build();
    
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response deletar(@PathParam("id") Long id) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para excluir clientes", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Cliente cliente = Cliente.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (cliente == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Cliente não encontrado", uriInfo.getPath())).build();
        }

        String nome = cliente.nome;
        cliente.delete();

        logService.registrar(getUserId(),"DELETE","Cliente", id, "Deletou cliente: " + nome, getClientIp(), getUserAgent());
        return Response.noContent().build();

    }

    @GET
    @Path("/dashboard")

    public Response dashboard() {

        Long adminId = getAdminId();
        List<Cliente> clientes = Cliente.find("adminId", adminId).list();

        long total = clientes.size();
        long primarios = clientes.stream().filter(c -> c.reuStatus == ReuStatus.PRIMARIO).count();
        long reincidentes = clientes.stream().filter(c -> c.reuStatus == ReuStatus.REINCIDENTE).count();

        java.util.Map<RegimePrisional, Long> porRegime = clientes.stream().filter(c -> c.regimePrisional != null).collect(Collectors.groupingBy(c -> c.regimePrisional, Collectors.counting()));
        java.util.Map<String, Long> porIdade = clientes.stream().filter(c -> c.dataNascimento != null).collect(Collectors.groupingBy(c -> getFaixaEtaria(c.dataNascimento), Collectors.counting()));
        java.util.Map<ComoConheceu, Long> porComoConheceu = clientes.stream().filter(c -> c.comoConheceu != null).collect(Collectors.groupingBy(c -> c.comoConheceu, Collectors.counting()));
        java.util.Map<String, Object> dashboard = new java.util.HashMap<>();

        dashboard.put("total", total);
        dashboard.put("primarios", primarios);
        dashboard.put("reincidentes", reincidentes);
        dashboard.put("porRegime", porRegime);
        dashboard.put("porIdade", porIdade);
        dashboard.put("porComoConheceu", porComoConheceu);

        return Response.ok(dashboard).build();

    }

    private ClienteResponse toResponse(Cliente entity) {

        ClienteResponse response = new ClienteResponse();
       
        response.id = entity.id;
        response.nome = entity.nome;
        response.cpf = entity.cpf;
        response.matriculaSap = entity.matriculaSap;
        response.regimePrisional = entity.regimePrisional;
        response.sexo = entity.sexo;
        response.dataNascimento = entity.dataNascimento;
        response.unidadePrisional = entity.unidadePrisional;
        response.numeroProcesso = entity.numeroProcesso;
        response.reuStatus = entity.reuStatus;
        response.crimesAcaoPenal = entity.crimesAcaoPenal;
        response.comoConheceu = entity.comoConheceu;
        response.observacoes = entity.observacoes;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;

        if (entity.contratantes != null) {
            
            response.contratantes = entity.contratantes.stream().map(c -> {

                ContratanteResponse r = new ContratanteResponse();

                r.id = c.id;
                r.nome = c.nome;
                r.telefone = c.telefone;
                r.grauParentesco = c.grauParentesco;

                return r;

            }).collect(Collectors.toList());

        }

        return response;

    }

    private void updateEntity(Cliente entity, ClienteRequest request) {

        entity.nome = request.nome;
        entity.cpf = request.cpf;
        entity.matriculaSap = request.matriculaSap;
        entity.regimePrisional = request.regimePrisional;
        entity.sexo = request.sexo;
        entity.dataNascimento = request.dataNascimento;
        entity.unidadePrisional = request.unidadePrisional;
        entity.numeroProcesso = request.numeroProcesso;
        entity.reuStatus = request.reuStatus;
        entity.crimesAcaoPenal = request.crimesAcaoPenal;
        entity.comoConheceu = request.comoConheceu;
        entity.observacoes = request.observacoes;

        if (request.contratantes != null) {

            entity.contratantes.clear();

            for (ContratanteRequest cr : request.contratantes) {

                Contratante c = new Contratante();

                c.cliente = entity;
                c.nome = cr.nome;
                c.telefone = cr.telefone;
                c.grauParentesco = cr.grauParentesco;

                entity.contratantes.add(c);

            }

        }

    }
}