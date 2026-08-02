package org.brocco.resource;

import org.brocco.entity.User;
import org.brocco.service.*;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.time.LocalDate;
import java.util.Map;
import java.nio.file.Files;

@Path("/backup")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "USER"})

public class BackupResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    BackupService backupService;

    @Inject
    AtividadeLogService logService;

    @Context
    HttpHeaders httpHeaders;

    @Context
    UriInfo uriInfo;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    private Long getAdminId() {
        User currentUser = User.findById(getUserId());
        return currentUser.adminId != null ? currentUser.adminId : currentUser.id;
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

    @GET
    @Path("/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)

    public Response downloadBackup() {

        try {
            Long adminId = getAdminId();
            byte[] backup = backupService.gerarBackup(adminId);
            String filename = "backup_admin_" + adminId + "_" + System.currentTimeMillis() + ".zip";
            logService.registrar(getUserId(),"BACKUP_DOWNLOAD","Sistema",null,"Baixou backup do sistema", getClientIp(), getUserAgent());
            return Response.ok(backup).header("Content-Disposition", "attachment; filename=\"" + filename + "\"").header("Content-Type", "application/zip").build();
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", "Erro ao gerar backup: " + e.getMessage())).build();
        }

    }

    @POST
    @Path("/restaurar")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Transactional

    public Response restaurarBackup(@RestForm("file") FileUpload file) {

        try {
            Long adminId = getAdminId();
            byte[] conteudo = Files.readAllBytes(file.filePath());
            Map<String, Object> resultado = backupService.restaurarBackup(conteudo, adminId);
            logService.registrar(getUserId(),"BACKUP_RESTORE","Sistema",null,"Restaurou backup do sistema", getClientIp(), getUserAgent());
            return Response.ok(resultado).build();
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", "Erro ao restaurar backup: " + e.getMessage())).build();
        }

    }

    @GET
    @Path("/listar")

    public Response listarBackups() {

        try {
            Long adminId = getAdminId();
            var backups = backupService.listarBackups(adminId);
            return Response.ok(Map.of("backups", backups)).build();
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", e.getMessage())).build();
        }

    }

    @DELETE
    @Path("/limpar")

    public Response limparBackups(@QueryParam("dias") @DefaultValue("30") int dias) {

        try {
            Long adminId = getAdminId();
            backupService.limparBackupsAntigos(adminId, dias);
            logService.registrar(getUserId(),"BACKUP_CLEANUP","Sistema",null, "Removeu backups com mais de " + dias + " dias", getClientIp(), getUserAgent());
            return Response.ok(Map.of("message", "Backups antigos removidos")).build();
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", e.getMessage())).build();
        }

    }

    @GET
    @Path("/exportar/{entidade}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)

    public Response exportarCSV(@PathParam("entidade") String entidade) {

        try {
            Long adminId = getAdminId();
            String csvData = backupService.gerarCSV(adminId, entidade);
            String filename = entidade + "_" + LocalDate.now() + ".csv";
            logService.registrar(getUserId(),"EXPORT","CSV",null, "Exportou dados de " + entidade + " para CSV", getClientIp(), getUserAgent());
            return Response.ok(csvData).header("Content-Disposition", "attachment; filename=\"" + filename + "\"").header("Content-Type", "text/csv; charset=UTF-8").build();
        } catch (IllegalArgumentException e) {
            return Response.status(400).entity(Map.of("error", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", "Erro ao exportar: " + e.getMessage())).build();
        }
    }
}