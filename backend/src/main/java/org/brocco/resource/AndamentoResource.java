package org.brocco.resource;

import org.brocco.dto.response.*;
import org.brocco.entity.*;
import org.brocco.enums.*;
import org.brocco.service.*;
import org.brocco.util.ErroResponse;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.graphics.image.*;

import org.imgscalr.Scalr;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.*;
import java.util.stream.Collectors;

@Path("/andamentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class AndamentoResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;

    @Inject
    AnexoService anexoService;

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

    private byte[] comprimirImagem(InputStream imagemStream, String formato) throws Exception {
        BufferedImage imagem = ImageIO.read(imagemStream);
        BufferedImage imagemRedimensionada = Scalr.resize(imagem, Scalr.Method.QUALITY, 1200);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(imagemRedimensionada, formato, baos);
        return baos.toByteArray();
    }

    private byte[] comprimirPdf(InputStream pdfStream) throws Exception {

        try (PDDocument document = Loader.loadPDF(pdfStream.readAllBytes())) {

            for (PDPage page : document.getPages()) {

                PDResources res = page.getResources();

                for (COSName name : res.getXObjectNames()) {

                    if (res.isImageXObject(name)) {
                        PDImageXObject image = (PDImageXObject) res.getXObject(name);
                        BufferedImage rawImage = image.getImage();
                        BufferedImage resizedImage = Scalr.resize(rawImage, Scalr.Method.QUALITY, 1200);
                        PDImageXObject compressedImage = JPEGFactory.createFromImage(document, resizedImage, 0.75f);
                        res.put(name, compressedImage);
                    }

                }

            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
    
        }

    }

    @GET
    @Path("/clientes")
    
    public Response listarClientesPendencias(@QueryParam("search") String search, @QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size) {
    
        Long adminId = getAdminId();
        List<Cliente> todosClientes = Cliente.list("adminId", adminId);
        
        List<Cliente> clientesComPendencia = todosClientes.stream().filter(c -> {
            long count = Providencia.count("cliente.id = ?1 AND adminId = ?2 AND status IN ('PENDENTE', 'EM_ANDAMENTO')", c.id, adminId);
            return count > 0;
        }).collect(Collectors.toList());
    
        if (search != null && !search.isEmpty()) {  
            String s = search.toLowerCase();
            clientesComPendencia = clientesComPendencia.stream().filter(c -> (c.nome != null && c.nome.toLowerCase().contains(s)) || (c.matriculaSap != null && c.matriculaSap.contains(s)) || (c.numeroProcesso != null && c.numeroProcesso.contains(s))).collect(Collectors.toList());
        }
    
        long total = clientesComPendencia.size();
        int start = page * size;
        int end = Math.min(start + size, (int) total);
        
        List<Cliente> paginados = start < total ? clientesComPendencia.subList(start, end) : new ArrayList<>();
    
        List<ClientePendenciaResponse> response = paginados.stream().map(c -> {
            
            long totalPendencias = Providencia.count("cliente.id = ?1 AND adminId = ?2 AND status IN ('PENDENTE', 'EM_ANDAMENTO')", c.id, adminId);
            ClientePendenciaResponse r = new ClientePendenciaResponse();
            
            r.id = c.id;
            r.nome = c.nome;
            r.matriculaSap = c.matriculaSap;
            r.numeroProcesso = c.numeroProcesso;
            r.regimePrisional = c.regimePrisional != null ? c.regimePrisional.getDescricao() : null;
            r.totalPendencias = totalPendencias;
            
            return r;
        
        }).collect(Collectors.toList());
    
        return Response.ok(new PageResponse<>(response, total, page, size)).build();
    }
    
    @GET
    @Path("/clientes/{clienteId}/providencias")

    public Response listarProvidenciasPendentes(@PathParam("clienteId") Long clienteId) {
        Long adminId = getAdminId();
        List<Providencia> providencias = Providencia.find("adminId = ?1 and cliente.id = ?2 and status in ('PENDENTE', 'EM_ANDAMENTO') order by dataAtendimento desc", adminId, clienteId).list();
        List<ProvidenciaAndamentoResponse> response = providencias.stream().map(this::toResponseAndamento).collect(Collectors.toList());
        return Response.ok(response).build();
    }

    @PUT
    @Path("/providencias/{providenciaId}/status")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response atualizarStatusProvidencia(@QueryParam("providenciaId") Long providenciaId, @QueryParam("status") String status) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para editar providências", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Providencia providencia = Providencia.find("id = ?1 and adminId = ?2", providenciaId, adminId).firstResult();

        if (providencia == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Providência não encontrada", uriInfo.getPath())).build();
        }

        try {

            StatusProvidencia novoStatus = StatusProvidencia.valueOf(status.toUpperCase());
            providencia.status = novoStatus;

            providencia.persist();
            logService.registrar(getUserId(),"UPDATE","Providência", providenciaId, "Atualizou status da providência para: " + novoStatus.getDescricao(), getClientIp(), getUserAgent());
            return Response.ok(Map.of("message", "Status atualizado com sucesso", "status", novoStatus.name())).build();

        } catch (IllegalArgumentException e) {
            return Response.status(400).entity(new ErroResponse(400, "Erro de validação", "Status inválido. Use: PENDENTE, EM_ANDAMENTO ou CONCLUIDA", uriInfo.getPath())).build();
        }

    }

    @GET
    @Path("/clientes/{clienteId}/anexos")

    public Response listarAnexos(@PathParam("clienteId") Long clienteId) {

        Long adminId = getAdminId();
        List<Anexo> anexos = anexoService.listarAnexos(clienteId, adminId);

        List<AnexoResponse> response = anexos.stream().map(a -> {

            AnexoResponse r = new AnexoResponse();

            r.id = a.uuid;
            r.nome = a.nome;
            r.tipo = a.tipo;
            r.tamanho = a.tamanho;
            r.url = a.url;
            r.uploadedAt = a.uploadedAt;

            return r;

        }).collect(Collectors.toList());

        return Response.ok(response).build();

    }

    @POST
    @Path("/clientes/{clienteId}/anexos")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response uploadAnexo(@PathParam("clienteId") Long clienteId, @RestForm("file") FileUpload file) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para fazer upload", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Cliente cliente = Cliente.find("id = ?1 and adminId = ?2", clienteId, adminId).firstResult();

        if (cliente == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Cliente não encontrado", uriInfo.getPath())).build();
        }

        try {

            String fileName = file.fileName();
            String contentType = file.contentType();
            InputStream fileStream = file.filePath().toFile().toURI().toURL().openStream();

            byte[] conteudo;

            if (contentType != null && contentType.startsWith("image/")) {
                String formato = contentType.split("/")[1];
                conteudo = comprimirImagem(fileStream, formato);
            } else if (contentType != null && contentType.equals("application/pdf")) {
                conteudo = comprimirPdf(fileStream);
            } else {

                ByteArrayOutputStream baos = new ByteArrayOutputStream();

                byte[] buffer = new byte[8192];
                int bytesRead;

                while ((bytesRead = fileStream.read(buffer)) != -1) {
                    baos.write(buffer, 0, bytesRead);
                }

                conteudo = baos.toByteArray();

            }

            Anexo anexo = anexoService.salvarAnexo(conteudo, fileName, contentType, adminId, clienteId);
            AnexoResponse response = new AnexoResponse();

            response.id = anexo.uuid;
            response.nome = anexo.nome;
            response.tipo = anexo.tipo;
            response.tamanho = anexo.tamanho;
            response.url = anexo.url;
            response.uploadedAt = anexo.uploadedAt;

            logService.registrar(getUserId(),"CREATE","Anexo",null, "Upload de anexo: " + fileName + " para o cliente: " + cliente.nome, getClientIp(), getUserAgent());
            return Response.status(Response.Status.CREATED).entity(response).build();

        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(Map.of("error", "Erro no upload: " + e.getMessage())).build();
        }

    }

    @GET
    @Path("/anexos/{uuid}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)

    public Response downloadAnexo(@PathParam("uuid") String uuid) {

        Long adminId = getAdminId();
        Anexo anexo = Anexo.find("uuid = ?1 and adminId = ?2", uuid, adminId).firstResult();

        if (anexo == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Anexo não encontrado", uriInfo.getPath())).build();
        }

        java.nio.file.Path filePath = anexoService.getArquivoPath(anexo.url, adminId, anexo.clienteId);

        if (!Files.exists(filePath)) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Arquivo não encontrado", uriInfo.getPath())).build();
        }

        return Response.ok(filePath.toFile()).header("Content-Disposition", "attachment; filename=\"" + anexo.nome + "\"").build();

    }

    @DELETE
    @Path("/anexos/{uuid}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response deletarAnexo(@PathParam("uuid") String uuid) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para excluir anexos", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Anexo anexo = Anexo.find("uuid = ?1 and adminId = ?2", uuid, adminId).firstResult();

        if (anexo == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Anexo não encontrado", uriInfo.getPath())).build();
        }

        String nome = anexo.nome;
        Long clienteId = anexo.clienteId;
        
        boolean deleted = anexoService.deletarAnexo(clienteId, uuid, adminId);

        if (!deleted) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Arquivo não encontrado", uriInfo.getPath())).build();
        }

        logService.registrar(getUserId(),"DELETE","Anexo",null, "Excluiu anexo: " + nome, getClientIp(), getUserAgent());
        return Response.noContent().build();

    }

    @GET
    @Path("/dashboard")

    public Response dashboard() {

        Long adminId = getAdminId();

        long totalPendentes = Providencia.count("adminId = ?1 and status = 'PENDENTE'", adminId);
        long totalEmAndamento = Providencia.count("adminId = ?1 and status = 'EM_ANDAMENTO'", adminId);
        long totalConcluidas = Providencia.count("adminId = ?1 and status = 'CONCLUIDA'", adminId);

        long total = totalPendentes + totalEmAndamento + totalConcluidas;
        double percentualConclusao = total > 0 ? (totalConcluidas * 100 / total) : 0;

        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("total", total);
        dashboard.put("pendentes", totalPendentes);
        dashboard.put("emAndamento", totalEmAndamento);
        dashboard.put("concluidas", totalConcluidas);
        dashboard.put("percentualConclusao", Math.round(percentualConclusao));

        return Response.ok(dashboard).build();
        
    }

    private ProvidenciaAndamentoResponse toResponseAndamento(Providencia entity) {

        ProvidenciaAndamentoResponse response = new ProvidenciaAndamentoResponse();

        response.id = entity.id;
        response.dataAtendimento = entity.dataAtendimento;
        response.status = entity.status;
        response.itens = entity.itens;
        response.observacoes = entity.observacoes;
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