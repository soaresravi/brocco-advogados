package org.brocco.resource;

import org.brocco.dto.request.*;
import org.brocco.dto.response.*;
import org.brocco.entity.*;
import org.brocco.enums.Permissao;
import org.brocco.service.AtividadeLogService;
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

@Path("/whatsapp")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class WhatsAppResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;

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

        Object adminIdClaim = jwt.getClaim("adminId");
        
        if (adminIdClaim != null) {
            return ((Number) adminIdClaim).longValue();
        }

        User currentUser = User.findById(getUserId());
        return currentUser.adminId != null ? currentUser.adminId : currentUser.id;
   
    }

    private boolean canEdit() {
        User user = User.findById(getUserId());
        return user.permissao == Permissao.ADMIN || user.permissao == Permissao.EDIT;
    }

    @GET
    
    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("search") String search, @QueryParam("dataInicio") String dataInicio, @QueryParam("dataFim") String dataFim) {

        Long adminId = getAdminId();
        
        StringBuilder query = new StringBuilder("adminId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(adminId);

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(nome) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or telefone like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(" or lower(assunto) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(")");
        }

        if (dataInicio != null && !dataInicio.isEmpty()) {
            query.append(" and dataContato >= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataInicio));
        }

        if (dataFim != null && !dataFim.isEmpty()) {
            query.append(" and dataContato <= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataFim));
        }

        query.append(" order by dataContato desc, id desc");
        long total = WhatsAppContato.find(query.toString(), params.toArray()).count();

        List<WhatsAppContato> lista = WhatsAppContato.find(query.toString(), params.toArray()).page(page, size).list();
        List<WhatsAppContatoResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());

        return Response.ok(new PageResponse<>(responseList, total, page, size)).build();

    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        WhatsAppContato entity = WhatsAppContato.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Contato não encontrado", uriInfo.getPath())).build();
        }

        return Response.ok(toResponse(entity)).build();

    }

    @POST
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response criar(@Valid WhatsAppContatoRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para criar contatos", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        WhatsAppContato entity = new WhatsAppContato();

        entity.adminId = adminId;
        entity.dataContato = request.dataContato;
        entity.nome = request.nome;
        entity.telefone = request.telefone;
        entity.assunto = request.assunto;

        entity.persist();
        logService.registrar(getUserId(),"CREATE","WhatsApp", entity.id, "Criou contato WhatsApp: " + entity.nome + " - " + entity.telefone, getClientIp(), getUserAgent());
        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response atualizar(@PathParam("id") Long id, @Valid WhatsAppContatoRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para editar contatos", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        WhatsAppContato entity =  WhatsAppContato.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Contato não encontrado", uriInfo.getPath())).build();
        }

        String nomeAntigo = entity.nome;
        entity.dataContato = request.dataContato;
        entity.nome = request.nome;
        entity.telefone = request.telefone;
        entity.assunto = request.assunto;
        
        entity.persist();
        logService.registrar(getUserId(),"UPDATE","WhatsApp", entity.id, "Atualizou contato WhatsApp: " + nomeAntigo + " -> " + entity.nome, getClientIp(), getUserAgent());
        return Response.ok(toResponse(entity)).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response deletar(@PathParam("id") Long id) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para excluir contatos", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        WhatsAppContato entity = WhatsAppContato.find("id = ?1 and (adminId = ?2 or adminId is null)", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Contato não encontrado", uriInfo.getPath())).build();
        }

        String nome = entity.nome;

        entity.delete();
        logService.registrar(getUserId(),"DELETE","WhatsApp", id, "Excluiu contato WhatsApp: " + nome, getClientIp(), getUserAgent());
        return Response.noContent().build();

    }

    private WhatsAppContatoResponse toResponse(WhatsAppContato entity) {

        WhatsAppContatoResponse response = new WhatsAppContatoResponse();

        response.id = entity.id;
        response.dataContato = entity.dataContato;
        response.nome = entity.nome;
        response.telefone = entity.telefone;
        response.assunto = entity.assunto;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;
        
        return response;
    
    }
}