package org.brocco.service;

import org.brocco.entity.AtividadeLog;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class AtividadeLogService {
    
    @Transactional
    public void registrar(Long userId, String acao, String entidade, Long entidadeId, String descricao, String ip, String userAgent) {

        AtividadeLog log = new AtividadeLog();

        log.userId = userId;
        log.acao = acao;
        log.entidade = entidade;
        log.entidadeId = entidadeId;
        log.descricao = descricao;
        log.ip = ip;
        log.userAgent = userAgent;
        
        log.persist();

    }

    public List<AtividadeLog> listar(Long userId, int page, int size) {
        return AtividadeLog.find("userId = ?1 order by createdAt desc", userId).page(page, size).list();
    }

    public long count(Long userId) {
        return AtividadeLog.count("userId", userId);
    }

    public long countByFilters(Long userId, String acao, String entidade, LocalDateTime dataInicio, LocalDateTime dataFim) {

        StringBuilder query = new StringBuilder("userId = ?1");
        List<Object> params = new java.util.ArrayList<>();

        params.add(userId);

        if (acao != null && !acao.isEmpty()) {
            query.append(" and acao = ?").append(params.size() + 1);
            params.add(acao);
        }

        if (entidade != null && !entidade.isEmpty()) {
            query.append(" and entidade = ?").append(params.size() + 1);
            params.add(entidade);
        }

        if (dataInicio != null) {
            query.append(" and createdAt >= ?").append(params.size() + 1);
            params.add(dataInicio);
        }

        if (dataFim != null) {
            query.append(" and createdAt <= ?").append(params.size() + 1);
            params.add(dataFim);
        }

        return AtividadeLog.find(query.toString(), params.toArray()).count();

    }

    public List<AtividadeLog> listarComFiltros(Long userId, String acao, String entidade, LocalDateTime dataInicio, LocalDateTime dataFim, int page, int size) {

        StringBuilder query = new StringBuilder("userId = ?1");
        List<Object> params = new java.util.ArrayList<>();

        params.add(userId);

        if (acao != null && !acao.isEmpty()) {
            query.append(" and acao = ?").append(params.size() + 1);
            params.add(acao);
        }

        if (entidade != null && !entidade.isEmpty()) {
            query.append(" and entidade = ?").append(params.size() + 1);
            params.add(entidade);
        }

        if (dataInicio != null) {
            query.append(" and createdAt >= ?").append(params.size() + 1);
            params.add(dataInicio);
        }

        if (dataFim != null) {
            query.append(" and createdAt <= ?").append(params.size() + 1);
            params.add(dataFim);
        }

        query.append(" order by createdAt desc");
        return AtividadeLog.find(query.toString(), params.toArray()).page(page, size).list();
    
    }

    @Transactional

    public void limparLogsAntigos(Long userId, int dias) {
        LocalDateTime dataLimite = LocalDateTime.now().minusDays(dias);
        AtividadeLog.delete("userId = ?1 and createdAt < ?2", userId, dataLimite);
    }
}