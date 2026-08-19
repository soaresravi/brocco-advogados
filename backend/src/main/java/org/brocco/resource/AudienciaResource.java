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

@Path("/audiencias")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class AudienciaResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    MicrosoftCalendarService microsoftCalendarService;

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
        User currentUser = User.findById(getUserId());
        return currentUser.adminId != null ? currentUser.adminId : currentUser.id;
    }

    private boolean canEdit() {
        User user = User.findById(getUserId());
        return user.permissao == Permissao.ADMIN || user.permissao == Permissao.EDIT;
    }

    @GET

    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("status") String status, @QueryParam("dataInicio") String dataInicio, @QueryParam("dataFim") String dataFim, @QueryParam("search") String search) {

        Long adminId = getAdminId();

        StringBuilder query = new StringBuilder("adminId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(adminId);

        if (status != null && !status.isEmpty()) {

            try {
                StatusEvento statusEnum = StatusEvento.valueOf(status.toUpperCase());
                query.append(" and status = ?").append(params.size() + 1);
                params.add(statusEnum);
            } catch (IllegalArgumentException e) {
                System.out.println("error");
            }

        }

        if (dataInicio != null && !dataInicio.isEmpty()) {
            query.append(" and data >= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataInicio));
        }

        if (dataFim != null && !dataFim.isEmpty()) {
            query.append(" and data <= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataFim));
        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(processoNumero) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(detalhes) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(")");
        }

        query.append(" order by data asc");
        long total = Audiencia.find(query.toString(), params.toArray()).count();

        List<Audiencia> lista = Audiencia.find(query.toString(), params.toArray()).page(page, size).list();
        List<AudienciaResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());

        return Response.ok(new PageResponse<>(responseList, total, page, size)).build();

    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        Audiencia entity = Audiencia.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Audiência não encontrada", uriInfo.getPath())).build();
        }

        return Response.ok(toResponse(entity)).build();

    }

    @POST
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response criar(@Valid AudienciaRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403,  "Proibido", "Você não tem permissão para criar audiências", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Processo processo = Processo.find("id = ?1 and adminId = ?2", request.processoId, adminId).firstResult();

        if (processo == null) {
            return Response.status(404).entity(new ErroResponse(404,  "Não encontrado", "Processo não encontrado", uriInfo.getPath())).build();
        }

        Audiencia entity = new Audiencia();

        entity.adminId = adminId;
        updateEntity(entity, request);
        entity.processoNumero = processo.numeroProcesso;   
        entity.persist();

        boolean microsoftOk = sincronizarMicrosoftCalendar(entity, true);
        logService.registrar(getUserId(),"CREATE","Audiência", entity.id, "Criou audiência para processo: " + entity.processoNumero, getClientIp(), getUserAgent());
        
        if (!microsoftOk) {
            return Response.status(498).entity(Map.of("message", "Token do Microsoft Outlook expirado. Reconecte sua conta.", "microsoftTokenExpirado", true)).build();
        }
        
        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response atualizar(@PathParam("id") Long id, @Valid AudienciaRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para editar audiências", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Audiencia entity = Audiencia.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Audiência não encontrada", uriInfo.getPath())).build();
        }

        Processo processo = Processo.find("id = ?1 and adminId = ?2", request.processoId, adminId).firstResult();

        if (processo == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Processo não encontrado", uriInfo.getPath())).build();
        }

        String processoNumeroAntigo = entity.processoNumero;
        updateEntity(entity, request);
        entity.processoNumero = processo.numeroProcesso;
        entity.persist();

        boolean microsoftOk = sincronizarMicrosoftCalendar(entity, false);
        logService.registrar(getUserId(),"UPDATE","Audiência", entity.id, "Atualizou audiência: " + processoNumeroAntigo + " -> " + entity.processoNumero, getClientIp(), getUserAgent());
        
        if (!microsoftOk) {
            return Response.status(498).entity(Map.of("message", "Token do Microsoft Outlook expirado. Reconecte sua conta.", "microsoftTokenExpirado", true)).build();
        }
        
        return Response.ok(toResponse(entity)).build();
    
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response deletar(@PathParam("id") Long id) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para excluir audiências", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Audiencia entity = Audiencia.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Audiência não encontrada", uriInfo.getPath())).build();
        }

        String microsoftEventId = entity.microsoftEventId;
        String processoNumero = entity.processoNumero;

        entity.delete();

        try {

            User user = User.findById(getUserId());

            if (user.microsoftRefreshToken != null && !user.microsoftRefreshToken.isEmpty() && microsoftEventId != null) {
                microsoftCalendarService.deletarEvento(user.microsoftRefreshToken, microsoftEventId);
            }

        } catch (Exception e) {
            System.err.println("Erro ao deletar evento do Microsoft Calendar: " + e.getMessage());
        }

        logService.registrar(getUserId(),"DELETE","Audiência", id, "Excluiu audiência do processo: " + processoNumero, getClientIp(), getUserAgent());
        return Response.noContent().build();

    }

    @GET
    @Path("/dashboard")

    public Response dashboard(@QueryParam("ano") Integer ano) {

        Long adminId = getAdminId();
        int anoFiltro = ano != null ? ano : LocalDate.now().getYear();

        List<Audiencia> todas = Audiencia.list("adminId", adminId);
        List<Audiencia> filtradas = todas.stream().filter(a -> a.data != null && a.data.getYear() == anoFiltro).collect(Collectors.toList());
        
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("total", filtradas.size());
        dashboard.put("agendadas", filtradas.stream().filter(a -> a.status == StatusEvento.AGENDADO).count());
        dashboard.put("concluidas", filtradas.stream().filter(a -> a.status == StatusEvento.CONCLUIDO).count());
        dashboard.put("canceladas", filtradas.stream().filter(a -> a.status == StatusEvento.CANCELADO).count());

        Map<String, Long> horarios = new LinkedHashMap<>();

        horarios.put("07h-09h", filtradas.stream().filter(a -> a.hora != null && a.hora.compareTo("07:00") >= 0 && a.hora.compareTo("09:00") < 0).count());
        horarios.put("09h-11h", filtradas.stream().filter(a -> a.hora != null && a.hora.compareTo("09:00") >= 0 && a.hora.compareTo("11:00") < 0).count());
        horarios.put("11h-13h", filtradas.stream().filter(a -> a.hora != null && a.hora.compareTo("11:00") >= 0 && a.hora.compareTo("13:00") < 0).count());
        horarios.put("13h-15h", filtradas.stream().filter(a -> a.hora != null && a.hora.compareTo("13:00") >= 0 && a.hora.compareTo("15:00") < 0).count());
        horarios.put("15h-17h", filtradas.stream().filter(a -> a.hora != null && a.hora.compareTo("15:00") >= 0 && a.hora.compareTo("17:00") < 0).count());
        horarios.put("17h+", filtradas.stream().filter(a -> a.hora != null && a.hora.compareTo("17:00") >= 0).count());

        dashboard.put("horarios", horarios);

        Map<Integer, Long> porMes = filtradas.stream().filter(a -> a.data != null).collect(Collectors.groupingBy(a -> a.data.getMonthValue(), Collectors.counting()));

        dashboard.put("porMes", porMes);
        dashboard.put("ano", anoFiltro);

        return Response.ok(dashboard).build();
    
    }

    @GET
    @Path("/hoje")

    public Response alertasHoje() {

        Long adminId = getAdminId();
        LocalDate hoje = LocalDate.now();
        List<Audiencia> hojeList = Audiencia.find("adminId = ?1 and data = ?2 and status = ?3", adminId, hoje, StatusEvento.AGENDADO).list();

        List<Map<String, Object>> result = hojeList.stream().map(a -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", a.id);
            map.put("data", a.data);
            map.put("hora", a.hora);
            map.put("processoNumero", a.processoNumero);
            map.put("detalhes", a.detalhes);
            map.put("local", a.local);

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    @GET
    @Path("/proximos")

    public Response alertaProximos() {

        Long adminId = getAdminId();
        LocalDate hoje = LocalDate.now();
        LocalDate daqui7Dias = hoje.plusDays(7);
        List<Audiencia> proximos = Audiencia.find("adminId = ?1 and data >= ?2 and data <= ?3 and status = ?4 order by data asc", adminId, hoje, daqui7Dias, StatusEvento.AGENDADO).list();

        List<Map<String, Object>> result = proximos.stream().map(a -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", a.id);
            map.put("data", a.data);
            map.put("hora", a.hora);
            map.put("processoNumero", a.processoNumero);
            map.put("detalhes", a.detalhes);
            map.put("diasRestantes", a.getDiasAteEvento());

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    private AudienciaResponse toResponse(Audiencia entity) {
        
        AudienciaResponse response = new AudienciaResponse();
        
        response.id = entity.id;
        response.data = entity.data;
        response.hora = entity.hora;
        response.status = entity.status;
        response.processoId = entity.processoId;
        response.processoNumero = entity.processoNumero;
        response.detalhes = entity.detalhes;
        response.local = entity.local;
        response.observacoes = entity.observacoes;
        response.diasAteEvento = entity.getDiasAteEvento();
        response.microsoftEventId = entity.microsoftEventId;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;
        
        return response;
    
    }

    private void updateEntity(Audiencia entity, AudienciaRequest request) {
        entity.data = request.data;
        entity.hora = request.hora;
        entity.status = request.status != null ? request.status : StatusEvento.AGENDADO;
        entity.processoId = request.processoId;
        entity.detalhes = request.detalhes;
        entity.local = request.local;
        entity.observacoes = request.observacoes;
    }

    private boolean sincronizarMicrosoftCalendar(Audiencia entity, boolean isNew) {

        try {

            User user = User.findById(getUserId());

            if (user.microsoftRefreshToken == null || user.microsoftRefreshToken.isEmpty()) {
                return true;
            }

            String titulo = "Audiência - " + entity.processoNumero;
            String descricao = "Processo: " + entity.processoNumero + "\n" + "Detalhes: " + (entity.detalhes != null ? entity.detalhes : "") + "\n" + "Local: " + (entity.local != null ? entity.local : "A definir") + "\n" + "Observações: " + (entity.observacoes != null ? entity.observacoes : "");

            if (isNew) {
                String eventId = microsoftCalendarService.criarEvento(user.microsoftRefreshToken, titulo, descricao, entity.data, entity.hora, 60L);
                entity.microsoftEventId = eventId;
                entity.persist();
            } else if (entity.microsoftEventId != null) {
                microsoftCalendarService.atualizarEvento(user.microsoftRefreshToken, entity.microsoftEventId, titulo, descricao, entity.data, entity.hora,60L);
            } else {
                String eventId = microsoftCalendarService.criarEvento(user.microsoftRefreshToken, titulo, descricao, entity.data, entity.hora, 60L);
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