package org.brocco.resource;

import org.brocco.dto.response.PageResponse;
import org.brocco.entity.*;
import org.brocco.enums.Permissao;
import org.brocco.service.AtividadeLogService;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.*;
import java.util.*;

@Path("/logs")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class AtividadeLogResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    private boolean isAdmin() {
        User user = User.findById(getUserId());
        return user != null && user.permissao == Permissao.ADMIN;
    }

    @GET
    
    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("20") int size, @QueryParam("acao") String acao, @QueryParam("entidade") String entidade, @QueryParam("dataInicio") String dataInicioStr, @QueryParam("dataFim") String dataFimStr) {

        Long userId = getUserId();

        if (!isAdmin()) {
            List<AtividadeLog> logs = logService.listar(userId, page, size);
            long total = logService.count(userId);
            return Response.ok(new PageResponse<>(logs, total, page, size)).build();
        }

        LocalDateTime dataInicio = null;
        LocalDateTime dataFim = null;

        if (dataInicioStr != null && !dataInicioStr.isEmpty()) {
            dataInicio = LocalDate.parse(dataInicioStr).atStartOfDay();
        }

        if (dataFimStr != null && !dataFimStr.isEmpty()) {
            dataFim = LocalDate.parse(dataFimStr).atTime(23, 59, 59);
        }

        long total = logService.countByFilters(userId, acao, entidade, dataInicio, dataFim);
        List<AtividadeLog> logs = logService.listarComFiltros(userId, acao, entidade, dataInicio, dataFim, page, size);

        return Response.ok(new PageResponse<>(logs, total, page, size)).build();

    }

    @GET
    @Path("/acoes")

    public Response listarAcoes() {
        return Response.ok(List.of("CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "BACKUP", "BACKUP_RESTORE", "EXPORT", "BACKUP_DOWNLOAD")).build();
    }

    @GET
    @Path("/entidades")

    public Response listarEntidades() {
        return Response.ok(List.of("Usuário", "Cliente", "Processo", "Audiencia", "Atendimento", "Tarefa", "Recebimento", "Despesa", "Documento", "Sistema", "Providencia", "Andamento")).build();
    }

    @DELETE
    @Path("/limpar")

    public Response limparLogs(@QueryParam("dias") @DefaultValue("30") int dias) {

        if (!isAdmin()) {
            return Response.status(403).entity(Map.of("error", "Apenas administradores podem limpar logs")).build();
        }

        logService.limparLogsAntigos(getUserId(), dias);
        return Response.ok(Map.of("message", "Logs com mais de \" + dias + \" dias foram removidos")).build();

    }
}