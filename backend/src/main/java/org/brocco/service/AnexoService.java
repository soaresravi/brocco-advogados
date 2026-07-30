package org.brocco.service;

import org.brocco.entity.Anexo;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@ApplicationScoped
public class AnexoService {
    
    @ConfigProperty(name = "uploads.directory", defaultValue = "/var/www/brocco/uploads")
    String UPLOAD_BASE_DIR;

    public Path getClienteUploadDir(Long adminId, Long clienteId) {
        return Paths.get(UPLOAD_BASE_DIR, String.valueOf(adminId), "clientes", String.valueOf(clienteId));
    }

    @Transactional
    public Anexo salvarAnexo(byte[] conteudo, String nomeArquivo, String contentType, Long adminId, Long clienteId) throws IOException {

        Path dir = getClienteUploadDir(adminId, clienteId);
        Files.createDirectories(dir);

        String timestamp = String.valueOf(System.currentTimeMillis());
        String nomeUnico = timestamp + "_" + nomeArquivo;

        Path filePath = dir.resolve(nomeUnico);
        Files.write(filePath, conteudo);

        String url = "/uploads/" + adminId + "/clientes/" + clienteId + "/" + nomeUnico;
        Anexo anexo = new Anexo();

        anexo.uuid = UUID.randomUUID().toString();
        anexo.nome = nomeArquivo;
        anexo.tipo = contentType;
        anexo.tamanho = (long) conteudo.length;
        anexo.url = url;
        anexo.adminId = adminId;
        anexo.clienteId = clienteId;

        anexo.persist();
        return anexo;

    }

    public List<Anexo> listarAnexos(Long clienteId, Long adminId) {
        return Anexo.find("clienteId = ?1 and adminId = ?2", clienteId, adminId).list();
    }

    public Anexo buscarAnexo(Long clienteId, String uuid, Long adminId) {
        return Anexo.find("clienteId = ?1 and uuid = ?2 and adminId = ?3", clienteId, uuid, adminId).firstResult();
    }

    @Transactional
    public boolean deletarAnexo(Long clienteId, String uuid, Long adminId) {

        Anexo anexo = buscarAnexo(clienteId, uuid, adminId);
        if (anexo == null) return false;

        try {
            String fileName = anexo.url.substring(anexo.url.lastIndexOf("/") + 1);
            Path filePath = getClienteUploadDir(adminId, clienteId).resolve(fileName);
            Files.deleteIfExists(filePath);
        } catch (Exception e) {
            System.err.println("Erro ao deletar arquivo físico: " + e.getMessage());
            return false;
        }

        anexo.delete();
        return true;

    }

    public Path getArquivoPath(String url, Long adminId, Long clienteId) {
        String fileName = url.substring(url.lastIndexOf("/") + 1);
        return getClienteUploadDir(adminId, clienteId).resolve(fileName);
    }
}