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

@Path("/financeiro/despesas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "EDIT"})

public class DespesaResource {
    
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
        User currentUser = User.findById(getUserId());
        return currentUser.adminId != null ? currentUser.adminId : currentUser.id;
    }

    @GET
    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("dataInicio") String dataInicio, @QueryParam("dataFim") String dataFim, @QueryParam("categoria") String categoria, @QueryParam("pago") String pago, @QueryParam("search") String search) {

        Long adminId = getAdminId();
        StringBuilder query = new StringBuilder("adminId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(adminId);

        if (dataInicio != null && !dataInicio.isEmpty()) {
            query.append(" and dataPrevistaPagamento >= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataInicio));
        }

        if (dataFim != null && !dataFim.isEmpty()) {
            query.append(" and dataPrevistaPagamento <= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataFim));
        }

        if (categoria != null && !categoria.isEmpty()) {

            try {
                CategoriaDespesa categoriaEnum = CategoriaDespesa.valueOf(categoria.toUpperCase());
                query.append(" and categoria = ?").append(params.size() + 1);
                params.add(categoriaEnum);
            } catch (IllegalArgumentException e) {
                System.out.println("error");
            }

        }

        if (pago != null && !pago.isEmpty()) {
            query.append(" and pago = ?").append(params.size() + 1);
            params.add("SIM".equals(pago));
        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(despesa) like").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(detalhes) like ?").append(params.size() + 1);
            query.append(")");
        }

        query.append(" order by dataPrevistaPagamento desc");
        long total = Despesa.find(query.toString(), params.toArray()).count();

        List<Despesa> lista = Despesa.find(query.toString(), params.toArray()).page(page, size).list();
        List<DespesaResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());

        return Response.ok(new PageResponse<>(responseList, total, page, size)).build();

    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        Despesa entity = Despesa.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Despesa não encontrada", uriInfo.getPath())).build();
        }

        return Response.ok(toResponse(entity)).build();

    }

    @POST
    @Transactional

    public Response criar(@Valid DespesaRequest request) {
        Long adminId = getAdminId();
        Despesa entity = new Despesa();
        entity.adminId = adminId;
        updateEntity(entity, request);
        entity.persist();
        logService.registrar(getUserId(),"CREATE","Despesa", entity.id, "Criou despesa: " + entity.despesa + " - R$ " + entity.valor, getClientIp(), getUserAgent());
        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, @Valid DespesaRequest request) {

        Long adminId = getAdminId();
        Despesa entity = Despesa.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Despesa não encontrada", uriInfo.getPath())).build();
        }

        String despesaAntiga = entity.despesa;
        updateEntity(entity, request);
        entity.persist();
        logService.registrar(getUserId(),"UPDATE","Despesa", entity.id, "Atualizou despesa: " + despesaAntiga + " -> " + entity.despesa, getClientIp(), getUserAgent());
        return Response.ok(toResponse(entity)).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional
    
    public Response deletar(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        Despesa entity = Despesa.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Despesa não encontrada", uriInfo.getPath())).build();
        }

        String despesaNome = entity.despesa;
        entity.delete();
        logService.registrar(getUserId(),"DELETE","Despesa", id, "Excluiu despesa: " + despesaNome, getClientIp(), getUserAgent());
        return Response.noContent().build();

    }

    @GET
    @Path("/alertas/atrasados")

    public Response alertasAtrasados() {

        Long adminId = getAdminId();
        LocalDate hoje = LocalDate.now();
        List<Despesa> atrasados = Despesa.list("adminId = ?1 and pago = false and dataPrevistaPagamento < ?2", adminId, hoje);

        List<Map<String, Object>> result = atrasados.stream().map(d -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", d.id);
            map.put("valor", d.valor);
            map.put("categoria", d.categoria.getDescricao());
            map.put("despesa", d.despesa);
            map.put("dataPrevistaPagamento", d.dataPrevistaPagamento);
            map.put("diasAtraso", java.time.temporal.ChronoUnit.DAYS.between(d.dataPrevistaPagamento, hoje));

            return map;

        }).collect(Collectors.toList());
        
        return Response.ok(result).build();

    }

    private DespesaResponse toResponse(Despesa entity) {
       
        DespesaResponse response = new DespesaResponse();
       
        response.id = entity.id;
        response.dataPrevistaPagamento = entity.dataPrevistaPagamento;
        response.dataEfetivaPagamento = entity.dataEfetivaPagamento;
        response.valor = entity.valor;
        response.categoria = entity.categoria;
        response.despesa = entity.despesa;
        response.pago = entity.pago;
        response.detalhes = entity.detalhes;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;
       
        return response;
    
    }

    private void updateEntity(Despesa entity, DespesaRequest request) {
        entity.dataPrevistaPagamento = request.dataPrevistaPagamento;
        entity.dataEfetivaPagamento = request.dataEfetivaPagamento;
        entity.valor = request.valor;
        entity.categoria = request.categoria;
        entity.despesa = request.despesa;
        entity.pago = request.pago != null ? request.pago : false;
        entity.detalhes = request.detalhes;
    }
}