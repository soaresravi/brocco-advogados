package org.brocco.resource;

import org.brocco.dto.response.*;
import org.brocco.entity.*;
import org.brocco.service.*;
import org.brocco.util.ErroResponse;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.*;
import java.util.stream.Collectors;

@Path("/notificacoes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class NotificacaoResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    NotificacaoService notificacaoService;

    @Inject
    AtividadeLogService logService;

    @Context
    HttpHeaders httpHeaders;

    @Context
    UriInfo uriInfo;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    private String getNomeUsuario(Long id) {
        if (id == null) return null;
        User user = User.findById(id);
        return user != null ? user.nome : null;
    }

    @GET
    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("20") int size) {
        Long userId = getUserId();
        List<Notificacao> notificacoes = notificacaoService.listarTodas(userId, page, size);
        long total = Notificacao.count("usuarioId", userId);
        List<NotificacaoResponse> response = notificacoes.stream().map(this::toResponse).collect(Collectors.toList());
        return Response.ok(new PageResponse<>(response, total, page, size)).build();
    }

    @GET
    @Path("/nao-lidas")

    public Response listarNaoLidas() {
        Long userId = getUserId();
        List<Notificacao> notificacoes = notificacaoService.listarNaoLidas(userId);
        long total = notificacaoService.contarNaoLidas(userId);
        List<NotificacaoResponse> response = notificacoes.stream().map(this::toResponse).collect(Collectors.toList());
        return Response.ok(Map.of("content", response, "total", total)).build();
    }

    @GET
    @Path("/contador")

    public Response contadorNaoLidas() {
        Long userId = getUserId();
        long total = notificacaoService.contarNaoLidas(userId);
        return Response.ok(Map.of("naoLidas", total)).build();
    }

    @PUT
    @Path("/{id}/marcar-lida")
    @Transactional

    public Response marcarComoLida(@PathParam("id") Long id) {
        Long userId = getUserId();
        notificacaoService.marcarComoLida(userId, id);
        return Response.ok(Map.of("message", "Notificação marcada como lida")).build();
    }

    @PUT
    @Path("/marcar-todas-lidas")
    @Transactional
    
    public Response marcarTodasComoLidas() {
        Long userId = getUserId();
        notificacaoService.marcarTodasComoLidas(userId);
        return Response.ok(Map.of("message", "Todas as notificações marcadas como lidas")).build();
    }

    @DELETE
    @Path("/limpar-antigas")
    @Transactional

    public Response limparAntigas(@QueryParam("dias") @DefaultValue("30") int dias) {
        Long userId = getUserId();
        notificacaoService.deletarAntigas(userId, dias);
        return Response.ok(Map.of("message", "Notificações com mais de " + dias + " dias removidas")).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {

        Long userId = getUserId();
        Notificacao notificacao = Notificacao.find("id = ?1 and usuarioId = ?2", id, userId).firstResult();

        if (notificacao == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Notificação não encontrada", uriInfo.getPath())).build();
        }

        notificacao.delete();
        return Response.noContent().build();

    }

    private NotificacaoResponse toResponse(Notificacao entity) {
        
        NotificacaoResponse response = new NotificacaoResponse();
        
        response.id = entity.id;
        response.remetenteId = entity.remetenteId;
        response.remetenteNome = getNomeUsuario(entity.remetenteId);
        response.tipo = entity.tipo;
        response.titulo = entity.titulo;
        response.mensagem = entity.mensagem;
        response.lida = entity.lida;
        response.entidadeId = entity.entidadeId;
        response.entidadeTipo = entity.entidadeTipo;
        response.link = entity.link;
        response.createdAt = entity.createdAt;

        return response;
    
    }
}