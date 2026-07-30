package org.brocco.scheduler;

import org.brocco.entity.*;
import org.brocco.enums.*;
import org.brocco.service.NotificacaoService;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class AlertScheduler {

    @Inject
    NotificacaoService notificacaoService;

    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional

    public void verificarAlertas() {
        verificarLapsoProgressao();
        verificarProvidenciasPendentes();
        verificarTarefasProximas();
    }

    private void verificarLapsoProgressao() {
        
        List<Processo> processos = Processo.list("lapsoProgressao is not null");
        LocalDate hoje = LocalDate.now();

        for (Processo processo : processos) {

            long dias = java.time.temporal.ChronoUnit.DAYS.between(hoje, processo.lapsoProgressao);

            if (dias <= 60 && dias >= 0) {

                Long adminId = processo.adminId;
                List<User> usuarios = User.find("adminId = ?1 or (id = ?1 and adminId is null)", adminId).list();

                for (User user : usuarios) {
                    notificacaoService.criar(user.id, null, TipoNotificacao.LAPSO_PROGRESSAO, "Lapso para progressão próximo!", "O processo " + (processo.numeroProcesso != null ? processo.numeroProcesso : "sem número") + " tem lapso para progressão em " + dias + " dias.", processo.id, "Processo", "/processos/" + processo.id);
                }
            
            }

        }

    }

    private void verificarProvidenciasPendentes() {

        List<Providencia> providencias = Providencia.list("status = 'PENDENTE'");
        LocalDate hoje = LocalDate.now();

        for (Providencia providencia : providencias) {

            long dias = java.time.temporal.ChronoUnit.DAYS.between(providencia.createdAt.toLocalDate(), hoje);

            if (dias >= 20) {
                criarNotificacaoProvidencia(providencia, "URGENTE! Providência pendente há 20 dias!", "\"Providência pendente há " + dias + " dias. Peticionar expedição de ofício.");
            } else if (dias >= 15) {
                criarNotificacaoProvidencia(providencia, "Providência pendente há 15 dias", "Providência pendente há " + dias + " dias. Peticionar expedição de ofício em breve.");
            }

        }

    }

    private void criarNotificacaoProvidencia(Providencia providencia, String titulo, String mensagem) {

        Long adminId = providencia.adminId;
        List<User> usuarios = User.find("adminId = ?1 or (id = ?1 and adminId is null)", adminId).list();

        for (User user : usuarios) {
            notificacaoService.criar(user.id,null, TipoNotificacao.PROVIDENCIA, titulo, mensagem + " Cliente: " + providencia.cliente.nome, providencia.id,"Providencia", "/andamentos/clientes/" + providencia.cliente.id);
        }

    }

    private void verificarTarefasProximas() {

        List<Tarefa> tarefas = Tarefa.list("status != 'CONCLUIDA' and prazo is not null");
        LocalDate hoje = LocalDate.now();

        for (Tarefa tarefa : tarefas) {

            long dias = java.time.temporal.ChronoUnit.DAYS.between(hoje, tarefa.prazo);

            if (dias <= 3 && dias >= 0) {
                notificacaoService.criar(tarefa.responsavelId != null ? tarefa.responsavelId : 1L,null, TipoNotificacao.TAREFA_PENDENTE,"Tarefa com prazo próximo!", "A tarefa \"" + tarefa.tarefa + "\" vence em " + dias + " dias.", tarefa.id,"Tarefa", "/tarefas/" + tarefa.id);
            }

        }

    }

}