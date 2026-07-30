package org.brocco.service;

import org.brocco.entity.Notificacao;
import org.brocco.enums.TipoNotificacao;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class NotificacaoService {
    
    @Transactional
    public Notificacao criar(Long usuarioId, Long remetenteId, TipoNotificacao tipo, String titulo, String mensagem, Long entidadeId, String entidadeTipo, String link) {

        Notificacao notificacao = new Notificacao();

        notificacao.usuarioId = usuarioId;
        notificacao.remetenteId = remetenteId;
        notificacao.tipo = tipo;
        notificacao.titulo = titulo;
        notificacao.mensagem = mensagem;
        notificacao.entidadeId = entidadeId;
        notificacao.entidadeTipo = entidadeTipo;
        notificacao.link = link;
        notificacao.lida = false;

        notificacao.persist();
        return notificacao;

    }

    public List<Notificacao> listarNaoLidas(Long usuarioId) {
        return Notificacao.find("usuarioId = ?1 and lida = false order by createdAt desc", usuarioId).list();
    }

    public List<Notificacao> listarTodas(Long usuarioId, int page, int size) {
        return Notificacao.find("usuarioId = ?1 order by createdAt desc", usuarioId).page(page, size).list();
    }

    public long contarNaoLidas(Long usuarioId) {
        return Notificacao.count("usuarioId = ?1 and lida = false", usuarioId);
    }

    @Transactional
    public void marcarComoLida(Long usuarioId, Long notificacaoId) {

        Notificacao notificacao = Notificacao.find("id = ?1 and usuarioId = ?2", notificacaoId, usuarioId).firstResult();

        if (notificacao != null) {
            notificacao.lida = true;
            notificacao.persist();
        }
        
    }

    @Transactional

    public void marcarTodasComoLidas(Long usuarioId) {
        Notificacao.update("lida = true where usuarioId = ?1", usuarioId);
    }

    @Transactional

    public void deletarAntigas(Long usuarioId, int dias) {
        LocalDateTime limite = LocalDateTime.now().minusDays(dias);
        Notificacao.delete("usuarioId = ?1 and createdAt < ?2", usuarioId, limite);
    }
}