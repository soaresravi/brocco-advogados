package org.brocco.resource;

import org.brocco.dto.request.*;
import org.brocco.dto.response.*;
import org.brocco.entity.*;
import org.brocco.service.*;
import org.brocco.util.ErroResponse;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;
import java.util.stream.Collectors;

@Path("/chat")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class MensagemResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    MensagemService mensagemService;

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

    private String getNomeUsuario(Long id) {
        if (id == null) return null;
        User user = User.findById(id);
        return user != null ? user.nome : null;
    }

    @GET
    @Path("/conversas")

    public Response listarConversas() {
        
        Long userId = getUserId();
        List<Long> usuariosIds = Mensagem.find("select distinct case when remetenteId = ?1 then destinatarioId else remetenteId end " + "from Mensagem where remetenteId = ?1 or destinatarioId = ?1", userId).project(Long.class).list();

        List<ConversaResponse> conversas = usuariosIds.stream().map(id -> {

            ConversaResponse response = new ConversaResponse();

            response.usuarioId = id;
            response.usuarioNome = getNomeUsuario(id);

            Mensagem ultima = Mensagem.find("(remetenteId = ?1 and destinatarioId = ?2) or (remetenteId = ?2 and destinatarioId = ?1) " + "order by createdAt desc", userId, id).firstResult();

            if (ultima != null) {
                response.ultimaMensagem = ultima.conteudo;
                response.ultimaData = ultima.createdAt;
            }

            response.naoLidas = mensagemService.contarNaoLidas(userId, id);
            return response;

        }).collect(Collectors.toList());

        return Response.ok(conversas).build();

    }

    @GET
    @Path("/conversa/{usuarioId}")

    public Response listarConversa(@QueryParam("usuarioId") Long outroUsuarioId, @QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("50") int size) {

        Long userId = getUserId();
        mensagemService.marcarComoLidas(userId, outroUsuarioId);

        List<Mensagem> mensagens = mensagemService.listarConversa(userId, outroUsuarioId, page, size);
        long total = Mensagem.count("(remetenteId = ?1 and destinatarioId = ?2) or (remetenteId = ?2 and destinatarioId = ?1)", userId, outroUsuarioId);

        List<MensagemResponse> response = mensagens.stream().map(m -> {
            
            MensagemResponse r = new MensagemResponse();

            r.id = m.id;
            r.remetenteId = m.remetenteId;
            r.remetenteNome = getNomeUsuario(m.remetenteId);
            r.destinatarioId = m.destinatarioId;
            r.destinatarioNome = getNomeUsuario(m.destinatarioId);
            r.conteudo = m.conteudo;
            r.lida = m.lida;
            r.createdAt = m.createdAt;

            return r;

        }).collect(Collectors.toList());

        return Response.ok(new PageResponse<>(response, total, page, size)).build();

    }

    @POST
    @Transactional

    public Response enviarMensagem(@Valid MensagemRequest request) {

        Long userId = getUserId();
        User destinatario = User.findById(request.destinatarioId);

        if (destinatario == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Usuário não encontrado", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Long destAdminId = destinatario.adminId != null ? destinatario.adminId : destinatario.id;

        if (!destAdminId.equals(adminId)) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Usuário não encontrado", uriInfo.getPath())).build();
        }

        Mensagem mensagem = mensagemService.salvar(userId, request.destinatarioId, request.conteudo);
        logService.registrar(userId,"CREATE","Mensagem", mensagem.id, "Enviou mensagem para: " + destinatario.nome, getClientIp(), getUserAgent());

        MensagemResponse response = new MensagemResponse();

        response.id = mensagem.id;
        response.remetenteId = mensagem.remetenteId;
        response.remetenteNome = getNomeUsuario(mensagem.remetenteId);
        response.destinatarioId = mensagem.destinatarioId;
        response.destinatarioNome = getNomeUsuario(mensagem.destinatarioId);
        response.conteudo = mensagem.conteudo;
        response.lida = mensagem.lida;
        response.createdAt = mensagem.createdAt;

        return Response.status(Response.Status.CREATED).entity(response).build();

    }

    @DELETE
    @Path("/conversa/{usuarioId}")
    @Transactional

    public Response deletarConversa(@PathParam("usuarioId") Long outroUsuarioId) {
        Long userId = getUserId();
        Mensagem.delete("(remetenteId = ?1 and destinatarioId = ?2) or (remetenteId = ?2 and destinatarioId = ?1)", userId, outroUsuarioId);
        return Response.noContent().build();
    }

    private Long getAdminId() {
        User currentUser = User.findById(getUserId());
        return currentUser.adminId != null ? currentUser.adminId : currentUser.id;
    }

}