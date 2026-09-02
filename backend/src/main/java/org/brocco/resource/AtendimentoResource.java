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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Path("/atendimentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class AtendimentoResource {
    
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

    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("dataInicio") String dataInicio, @QueryParam("dataFim") String dataFim, @QueryParam("clienteNovo") String clienteNovo, @QueryParam("fechouContrato") String fechouContrato, @QueryParam("search") String search) {

        Long adminId = getAdminId();

        StringBuilder query = new StringBuilder("adminId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(adminId);

        if (dataInicio != null && !dataInicio.isEmpty()) {
            query.append(" and data >= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataInicio));
        }

        if (dataFim != null && !dataFim.isEmpty()) {
            query.append(" and data <= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataFim));
        }

        if (clienteNovo != null && !clienteNovo.isEmpty()) {

            try {
                SimNao simNao = SimNao.valueOf(clienteNovo.toUpperCase());
                query.append(" and clienteNovo = ?").append(params.size() + 1);
                params.add(simNao);
            } catch (IllegalArgumentException e) {
                System.out.println("error");
            }

        }

        if (fechouContrato != null && !fechouContrato.isEmpty()) {

            try {
                SimNao simNao = SimNao.valueOf(fechouContrato.toUpperCase());
                query.append(" and fechouContrato = ?").append(params.size() + 1);
                params.add(simNao);
            } catch (IllegalArgumentException e) {
                System.out.println("error");
            }

        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(nome) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(assunto) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or telefone like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(" or lower(email) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(")");
        }

        query.append(" order by data desc, hora desc");
        long total = Atendimento.find(query.toString(), params.toArray()).count();

        List<Atendimento> lista = Atendimento.find(query.toString(), params.toArray()).page(page, size).list();
        List<AtendimentoResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());

        return Response.ok(new PageResponse<>(responseList, total, page, size)).build();

    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        Atendimento entity = Atendimento.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Atendimento não encontrado", uriInfo.getPath())).build();
        }

        return Response.ok(toResponse(entity)).build();

    }

    @POST
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response criar(@Valid AtendimentoRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para criar atendimentos", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Atendimento entity = new Atendimento();
       
        entity.adminId = adminId;
        updateEntity(entity, request);
        entity.persist();
        
        boolean microsoftOk = sincronizarMicrosoftCalendar(entity, true);
        logService.registrar(getUserId(),"CREATE","Atendimento", entity.id, "Criou atendimento para: " + entity.nome, getClientIp(), getUserAgent());
        
        if (!microsoftOk) {
            return Response.status(498).entity(Map.of("message", "Token do Microsoft Outlook expirado. Reconecte sua conta nas configurações.", "microsoftTokenExpirado", true)).build();
        }
        
        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();
    
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response atualizar(@PathParam("id") Long id, @Valid AtendimentoRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para editar atendimentos", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Atendimento entity = Atendimento.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Atendimento não encontrado", uriInfo.getPath())).build();
        }

        String nomeAntigo = entity.nome;
        updateEntity(entity, request);
        entity.persist();
        
        boolean microsoftOk = sincronizarMicrosoftCalendar(entity, false);
        logService.registrar(getUserId(),"UPDATE","Atendimento", entity.id, "Atualizou atendimento: " + nomeAntigo + " -> " + entity.nome, getClientIp(), getUserAgent());
        
        if (!microsoftOk) {
            return Response.status(498).entity(Map.of("message", "Token do Microsoft Outlook expirado. Reconecte sua conta nas configurações.", "microsoftTokenExpirado", true)).build();
        }
        
        return Response.ok(toResponse(entity)).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response deletar(@PathParam("id") Long id) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para excluir atendimentos", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Atendimento entity = Atendimento.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Atendimento não encontrado", uriInfo.getPath())).build();
        }

        String microsoftEventId = entity.microsoftEventId;
        String nome = entity.nome;

        entity.delete();

        try {

            User user = User.findById(getUserId());

            if (user.microsoftRefreshToken != null && !user.microsoftRefreshToken.isEmpty() && microsoftEventId != null) {
                microsoftCalendarService.deletarEvento(user.microsoftRefreshToken, microsoftEventId);
            }

        } catch (Exception e) {
            System.err.println("Erro ao deletar evento do Microsoft Calendar: " + e.getMessage());
        }

        logService.registrar(getUserId(),"DELETE","Atendimento", id, "Excluiu atendimento: " + nome, getClientIp(), getUserAgent());
        return Response.noContent().build();

    }

    @GET
    @Path("/dashboard")

    public Response dashboard(@QueryParam("ano") Integer ano) {

        Long adminId = getAdminId();
        int anoFiltro = ano != null ? ano : LocalDate.now().getYear();

        List<Atendimento> todos = Atendimento.list("adminId", adminId);
        List<Atendimento> filtrados = todos.stream().filter(a -> a.data != null && a.data.getYear() == anoFiltro).collect(Collectors.toList());

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("total", filtrados.size());

        BigDecimal totalConsultas = filtrados.stream().filter(a -> a.valorConsulta != null).map(a -> a.valorConsulta).reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.put("totalConsultas", totalConsultas);

        long novos = filtrados.stream().filter(a -> a.clienteNovo == SimNao.SIM).count();
        long antigos = filtrados.stream().filter(a -> a.clienteNovo == SimNao.NAO).count();

        Map<String, Object> novosAntigos = new LinkedHashMap<>();
        
        novosAntigos.put("Novos", Map.of("quantidade", novos, "percentual", filtrados.size() > 0 ? (novos * 100 / filtrados.size()) : 0));
        novosAntigos.put("Antigos", Map.of("quantidade", antigos, "percentual", filtrados.size() > 0 ? (antigos * 100 / filtrados.size()) : 0));

        dashboard.put("novosAntigos", novosAntigos);

        long fechou = filtrados.stream().filter(a -> a.fechouContrato == SimNao.SIM).count();
        long naoFechou = filtrados.stream().filter(a -> a.fechouContrato == SimNao.NAO).count();

        Map<String, Object> fechouContrato = new LinkedHashMap<>();

        fechouContrato.put("Fechou", Map.of("quantidade", fechou, "percentual", filtrados.size() > 0 ? (fechou * 100 / filtrados.size()) : 0));
        fechouContrato.put("Não fechou", Map.of("quantidade", naoFechou, "percentual", filtrados.size() > 0 ? (naoFechou * 100 / filtrados.size()) : 0));

        dashboard.put("fechouContrato", fechouContrato);

        Map<Integer, Long> porMes = filtrados.stream().filter(a -> a.data != null).collect(Collectors.groupingBy(a -> a.data.getMonthValue(), Collectors.counting()));
        dashboard.put("porMes", porMes);
        dashboard.put("ano", anoFiltro);

        return Response.ok(dashboard).build();

    }

    @GET
    @Path("/contatos/hoje")
    public Response contatosHoje() {

        Long adminId = getAdminId();
        LocalDate hoje = LocalDate.now();

        List<Atendimento> contatos = Atendimento.find("adminId = ?1 and dataProximoContato = ?2", adminId, hoje).list();
        
        List<Map<String, Object>> result = contatos.stream().map(a -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", a.id);
            map.put("nome", a.nome);
            map.put("telefone", a.telefone);
            map.put("email", a.email);
            map.put("assunto", a.assunto);

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    @GET
    @Path("/hoje")

    public Response atendimentosHoje() {

        Long adminId = getAdminId();
        LocalDate hoje = LocalDate.now();

        List<Atendimento> hojeList = Atendimento.find("adminId = ?1 and data = ?2", adminId, hoje).list();
        List<AtendimentoResponse> result = hojeList.stream().map(this::toResponse).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    private AtendimentoResponse toResponse(Atendimento entity) {

        AtendimentoResponse response = new AtendimentoResponse();
        
        response.id = entity.id;
        response.data = entity.data;
        response.hora = entity.hora;
        response.clienteNovo = entity.clienteNovo;
        response.nome = entity.nome;
        response.assunto = entity.assunto;
        response.telefone = entity.telefone;
        response.email = entity.email;
        response.dataProximoContato = entity.dataProximoContato;
        response.comoConheceu = entity.comoConheceu;
        response.fechouContrato = entity.fechouContrato;
        response.valorConsulta = entity.valorConsulta;
        response.observacoes = entity.observacoes;
        response.microsoftEventId = entity.microsoftEventId;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;
        
        return response;
    
    }

    private void updateEntity(Atendimento entity, AtendimentoRequest request) {
        entity.data = request.data;
        entity.hora = request.hora;
        entity.clienteNovo = request.clienteNovo != null ? request.clienteNovo : SimNao.NAO;
        entity.nome = request.nome;
        entity.assunto = request.assunto;
        entity.telefone = request.telefone;
        entity.email = request.email;
        entity.dataProximoContato = request.dataProximoContato;
        entity.comoConheceu = request.comoConheceu;
        entity.fechouContrato = request.fechouContrato != null ? request.fechouContrato : SimNao.NAO;
        entity.valorConsulta = request.valorConsulta != null ? request.valorConsulta : BigDecimal.ZERO;
        entity.observacoes = request.observacoes;
    }

    private boolean sincronizarMicrosoftCalendar(Atendimento entity, boolean isNew) {

        try {

            User user = User.findById(getUserId());

            if (user.microsoftRefreshToken == null || user.microsoftRefreshToken.isEmpty()) {
                return true;
            }

            String titulo = "Atendimento - " + entity.nome;
            String descricao = "Assunto: " + (entity.assunto != null ? entity.assunto : "") + "\n" + "Telefone: " + (entity.telefone != null ? entity.telefone : "") + "\n" + "Email: " + (entity.email != null ? entity.email : "") + "\n" + "Observações: " + (entity.observacoes != null ? entity.observacoes : "");

            if (isNew) {
                String eventId = microsoftCalendarService.criarEvento(user.microsoftRefreshToken, titulo, descricao, entity.data, entity.hora,30L);
                entity.microsoftEventId = eventId;
                entity.persist();
            } else if (entity.microsoftEventId != null) {
                microsoftCalendarService.atualizarEvento(user.microsoftRefreshToken, entity.microsoftEventId, titulo, descricao, entity.data, entity.hora,30L);
            } else {
                String eventId = microsoftCalendarService.criarEvento(user.microsoftRefreshToken, titulo, descricao, entity.data, entity.hora,30L);
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