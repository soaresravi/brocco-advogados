package org.brocco.service;

import org.brocco.entity.Mensagem;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class MensagemService {
    
    @Transactional
    public Mensagem salvar(Long remetenteId, Long destinatarioId, String conteudo) {

        Mensagem mensagem = new Mensagem();

        mensagem.remetenteId = remetenteId;
        mensagem.destinatarioId = destinatarioId;
        mensagem.conteudo = conteudo;
        mensagem.lida = false;

        mensagem.persist();
        return mensagem;

    }

    public List<Mensagem> listarConversa(Long usuarioId1, Long usuarioId2, int page, int size) {
        return Mensagem.find("(remetenteId = ?1 and destinatarioId = ?2) or (remetenteId = ?2 and destinatarioId = ?1) " + "order by createdAt desc", usuarioId1, usuarioId2).page(page, size).list();
    }

    public long contarNaoLidas(Long usuarioId, Long remetenteId) {
        return Mensagem.count("destinatarioId = ?1 and remetenteId = ?2 and lida = false", usuarioId, remetenteId);
    }

    @Transactional

    public void marcarComoLidas(Long usuarioId, Long remetenteId) {
        Mensagem.update("lida = true where destinatarioId = ?1 and remetenteId = ?2 and lida = false", usuarioId, remetenteId);
    }
    
    public List<ConversaDto> listarConversas(Long usuarioId) {

        List<Long> usuariosIds = Mensagem.find("select distinct case when remetenteId = ?1 then destinatarioId else remetenteId end from Mensagem where remetenteId = ?1 or destinatarioId = ?1", usuarioId).project(Long.class).list();
        List<ConversaDto> conversas = new ArrayList<>();
    
        for (Long outroId : usuariosIds) {

            Mensagem ultima = Mensagem.find("(remetenteId = ?1 and destinatarioId = ?2) or (remetenteId = ?2 and destinatarioId = ?1) order by createdAt desc", usuarioId, outroId).firstResult();
            ConversaDto dto = new ConversaDto();
        
            dto.usuarioId = outroId;
            dto.ultimaMensagem = ultima != null ? ultima.conteudo : null;
            dto.ultimaData = ultima != null ? ultima.createdAt : null;
            dto.naoLidas = contarNaoLidas(usuarioId, outroId);
        
            conversas.add(dto);
    
        }
    
        conversas.sort((a, b) -> {
            if (a.ultimaData == null && b.ultimaData == null) return 0;
            if (a.ultimaData == null) return 1;
            if (b.ultimaData == null) return -1;
            return b.ultimaData.compareTo(a.ultimaData);
        });
    
        return conversas;
    }

    public static class ConversaDto {
        public Long usuarioId;
        public String ultimaMensagem;
        public LocalDateTime ultimaData;
        public long naoLidas;
    }
}