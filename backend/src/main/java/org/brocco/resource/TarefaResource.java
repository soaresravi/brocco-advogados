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

@Path("/tarefas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class TarefaResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;

    @Context
    HttpHeaders httpHeaders;

    @Context
    UriInfo uriInfo;

    @Inject
    MicrosoftCalendarService microsoftCalendarService;

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
    @Path("/dashboard")

    public Response dashboard(@QueryParam("ano") Integer ano) {

        Long adminId = getAdminId();
        int anoFiltro = ano != null ? ano : LocalDate.now().getYear();

        List<Tarefa> tarefas = Tarefa.list("adminId", adminId);
        List<Tarefa> filtradas = tarefas.stream().filter(t -> t.createdAt != null && t.createdAt.getYear() == anoFiltro).collect(Collectors.toList());

        long total = filtradas.size();
        long concluidas = filtradas.stream().filter(t -> t.status == StatusTarefa.CONCLUIDA).count();
        long naoConcluidas = total - concluidas;

        double percentual = total > 0 ? (concluidas * 100 / total) : 0;
        
        Map<Integer, Long> porMes = filtradas.stream().filter(t -> t.createdAt != null).collect(Collectors.groupingBy(t -> t.createdAt.getMonthValue(), Collectors.counting()));
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("total", total);
        dashboard.put("concluidas", concluidas);
        dashboard.put("naoConcluidas", naoConcluidas);
        dashboard.put("percentualConclusao", Math.round(percentual));
        dashboard.put("porMes", porMes);
        dashboard.put("ano", anoFiltro);

        return Response.ok(dashboard).build();

    }

    @GET

    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("search") String search, @QueryParam("status") String status, @QueryParam("urgencia") String urgencia, @QueryParam("responsavelId") Long responsavelId) {

        Long adminId = getAdminId();

        StringBuilder query = new StringBuilder("adminId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(adminId);

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(tarefa) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(clienteNome) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or processoNumero like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(")");
        }

        if (status != null && !status.isEmpty()) {

            try {
                StatusTarefa statusEnum = StatusTarefa.valueOf(status.toUpperCase());
                query.append(" and status = ?").append(params.size() + 1);
                params.add(statusEnum);
            } catch (IllegalArgumentException e) {
                System.out.println("error");
            }

        }

        if (urgencia != null && !urgencia.isEmpty()) {

            try {
                UrgenciaTarefa urgenciaEnum = UrgenciaTarefa.valueOf(urgencia.toUpperCase());
                query.append(" and urgencia = ?").append(params.size() + 1);
                params.add(urgenciaEnum);
            } catch (IllegalArgumentException e) {
                System.out.println("error");
            }
            
        }

        if (responsavelId != null) {
            query.append(" and responsavelId = ?").append(params.size() + 1);
            params.add(responsavelId);
        }

        query.append(" order by prazo asc nulls last, id desc");
        long total = Tarefa.find(query.toString(), params.toArray()).count();

        List<Tarefa> tarefas = Tarefa.find(query.toString(), params.toArray()).page(page, size).list();
        List<TarefaResponse> response = tarefas.stream().map(this::toResponse).collect(Collectors.toList());

        return Response.ok(new PageResponse<>(response, total, page, size)).build();

    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {
        
        Long adminId = getAdminId();
        Tarefa entity = Tarefa.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Tarefa não encontrada", uriInfo.getPath())).build();
        }

        return Response.ok(toResponse(entity)).build();

    }

    @POST
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response criar(@Valid TarefaRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para criar tarefas", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();

        if (request.responsavelId != null) {
            
            User user = User.findById(request.responsavelId);
            
            if (user == null) {
                return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Responsável não encontrado", uriInfo.getPath())).build();
            }

            Long userAdminId = user.adminId != null ? user.adminId : user.id;
            Long currentAdminId = adminId;
            
            if (!userAdminId.equals(currentAdminId)) {
                return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Responsável não encontrado", uriInfo.getPath())).build();
            }
            
        }

        Tarefa entity = new Tarefa();
        entity.adminId = adminId;
        updateEntity(entity, request);
        entity.persist();
       
        boolean microsoftOk = sincronizarMicrosoftCalendar(entity, true);
        logService.registrar(getUserId(),"CREATE","Tarefa",entity.id, "Criou tarefa: " + (entity.tarefa != null ? entity.tarefa.substring(0, Math.min(50, entity.tarefa.length())) : "sem descrição"), getClientIp(), getUserAgent());
       
        if (!microsoftOk) {
            return Response.status(498).entity(Map.of("message", "Token do Microsoft Outlook expirado. Reconecte sua conta nas configurações.","microsoftTokenExpirado", true)).build();
        }
        
        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response atualizar(@PathParam("id") Long id, @Valid TarefaRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para editar tarefas", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Tarefa entity = Tarefa.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Tarefa não encontrada", uriInfo.getPath())).build();
        }

        String tarefaAntiga = entity.tarefa;
        updateEntity(entity, request);
        entity.persist();
      
        boolean microsoftOk = sincronizarMicrosoftCalendar(entity, false);
        logService.registrar(getUserId(),"UPDATE","Tarefa", entity.id, "Atualizou tarefa: " + (tarefaAntiga != null ? tarefaAntiga.substring(0, Math.min(50, tarefaAntiga.length())) : "sem descrição"), getClientIp(), getUserAgent());
      
        if (!microsoftOk) {
            return Response.status(498).entity(Map.of("message", "Token do Microsoft Outlook expirado. Reconecte sua conta nas configurações.","microsoftTokenExpirado", true)).build();
        }
        
        return Response.ok(toResponse(entity)).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response deletar(@PathParam("id") Long id) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para excluir tarefas", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Tarefa entity = Tarefa.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Tarefa não encontrada", uriInfo.getPath())).build();
        }

        String tarefa = entity.tarefa;
        String microsoftEventId = entity.microsoftEventId;

        entity.delete();

        try {

            User user = User.findById(getUserId());

            if (user.microsoftRefreshToken != null && !user.microsoftRefreshToken.isEmpty() && microsoftEventId != null) {
                microsoftCalendarService.deletarEvento(user.microsoftRefreshToken, microsoftEventId);
            }

        } catch (Exception e) {
            System.out.println("Erro ao deletar evento do Microsoft Calendar: " + e.getMessage());
        }

        logService.registrar(getUserId(),"DELETE","Tarefa", id, "Excluiu tarefa: " + (tarefa != null ? tarefa.substring(0, Math.min(50, tarefa.length())) : "sem descrição"), getClientIp(), getUserAgent());
        return Response.noContent().build();

    }

    private TarefaResponse toResponse(Tarefa entity) {
        
        TarefaResponse response = new TarefaResponse();
        
        response.id = entity.id;
        response.tarefa = entity.tarefa;
        response.status = entity.status;
        response.urgencia = entity.urgencia;
        response.prazo = entity.prazo;
        response.responsavelId = entity.responsavelId;
        response.processoId = entity.processoId;
        response.processoNumero = entity.processoNumero;
        response.clienteId = entity.clienteId;
        response.clienteNome = entity.clienteNome;
        response.andamento = entity.andamento;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;
        response.microsoftEventId = entity.microsoftEventId; 

        if (entity.responsavelId != null) {
            User user = User.findById(entity.responsavelId);
            response.responsavelNome = user != null ? user.nome : null;
        }

        return response;
    
    }

    private void updateEntity(Tarefa entity, TarefaRequest request) {
        entity.tarefa = request.tarefa;
        entity.status = request.status != null ? request.status : StatusTarefa.NAO_INICIADA;
        entity.urgencia = request.urgencia;
        entity.prazo = request.prazo;
        entity.responsavelId = request.responsavelId;
        entity.processoId = request.processoId;
        entity.processoNumero = request.processoNumero;
        entity.clienteId = request.clienteId;
        entity.clienteNome = request.clienteNome;
        entity.andamento = request.andamento;
    }

    private boolean sincronizarMicrosoftCalendar(Tarefa entity, boolean isNew) {
        
        try {
          
            User user = User.findById(getUserId());
    
            if (user.microsoftRefreshToken == null || user.microsoftRefreshToken.isEmpty()) {
                return true;
            }
    
            if (entity.prazo == null) {
                return true;
            }
    
            String titulo = "Tarefa: " + (entity.tarefa != null ? entity.tarefa.substring(0, Math.min(30, entity.tarefa.length())) : "Sem título");
            String descricao = "Tarefa: " + (entity.tarefa != null ? entity.tarefa : "") + "\nStatus: " + (entity.status != null ? entity.status.getDescricao() : "") + "\nCliente: " + (entity.clienteNome != null ? entity.clienteNome : "") + "\nProcesso: " + (entity.processoNumero != null ? entity.processoNumero : "");
            String horaEvento = "09:00";
        
            Long duracao = 30L;
    
            if (isNew) {
                String eventId = microsoftCalendarService.criarEvento(user.microsoftRefreshToken, titulo, descricao, entity.prazo, horaEvento, duracao);
                entity.microsoftEventId = eventId;
                entity.persist();
            } else if (entity.microsoftEventId != null) {
                microsoftCalendarService.atualizarEvento(user.microsoftRefreshToken, entity.microsoftEventId, titulo, descricao, entity.prazo, horaEvento, duracao);
            } else {
                String eventId = microsoftCalendarService.criarEvento(user.microsoftRefreshToken, titulo, descricao, entity.prazo, horaEvento, duracao);
                entity.microsoftEventId = eventId;
                entity.persist();
            }
    
            return true;
    
        } catch (Exception e) {
           
            System.err.println("Erro ao sincronizar com Microsoft Calendar: " + e.getMessage());
    
            if (microsoftCalendarService.isTokenExpirado(e)) {
                
                User user = User.findById(getUserId());
                
                if (user != null) {
                  
                    user.microsoftRefreshToken = null;
                    user.microsoftEmail = null;
                    user.persist();
                  
                    System.err.println("Token Microsoft expirado, desconectado automaticamente");
                
                }
                
                return false;
           
            }
    
            return true;
       
        }

    }
}