package org.brocco.resource;

import org.brocco.dto.response.*;
import org.brocco.entity.*;
import org.brocco.enums.*;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Path("/painel")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class PainelResource {
    
    @Inject
    JsonWebToken jwt;

    @Context
    HttpHeaders httpHeaders;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    private Long getAdminId() {
        User currentUser = User.findById(getUserId());
        return currentUser.adminId != null ? currentUser.adminId : currentUser.id;
    }

    private String getNomeUsuario(Long id) {
        if (id == null) return null;
        User user = User.findById(id);
        return user != null ? user.nome : null;
    }

    @GET
    public Response painel() {

        Long adminId = getAdminId();

        ZoneId brasiliaZone = ZoneId.of("America/Sao_Paulo");
        LocalDateTime agora = LocalDateTime.now(brasiliaZone);
        LocalDate hoje = agora.toLocalDate();
        PainelResponse response = new PainelResponse();

        response.dataHora = agora.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
        response.fuso = "America/Sao_Paulo";
        response.processosAtivos = Processo.count("adminId = ?1 and situacao = ?2", adminId, SituacaoProcesso.ATIVO);
        response.audienciasAgendadas = Audiencia.count("adminId = ?1 and status = ?2 and data >= ?3", adminId, StatusEvento.AGENDADO, hoje);
        response.clientesCadastrados = Cliente.count("adminId", adminId);

        List<Tarefa> tarefasHoje = Tarefa.find("adminId = ?1 and prazo = ?2 and status != ?3", adminId, hoje, StatusTarefa.CONCLUIDA).list();
        Map<String, List<TarefaSimplesResponse>> tarefasPorUrgencia = new LinkedHashMap<>();

        for (UrgenciaTarefa urgencia : UrgenciaTarefa.values()) {
            tarefasPorUrgencia.put(urgencia.getDescricao(), new ArrayList<>());
        }

        for (Tarefa tarefa : tarefasHoje) {

            if (tarefa.urgencia == null) continue;
            TarefaSimplesResponse t = new TarefaSimplesResponse();

            t.id = tarefa.id;
            t.tarefa = tarefa.tarefa;
            t.status = tarefa.status;
            t.urgencia = tarefa.urgencia;
            t.prazo = tarefa.prazo;
            t.responsavelNome = getNomeUsuario(tarefa.responsavelId);
            t.clienteNome = tarefa.clienteNome;
            
            tarefasPorUrgencia.get(tarefa.urgencia.getDescricao()).add(t);

        }

        response.tarefasDoDia = tarefasPorUrgencia;
        response.totalTarefasHoje = tarefasHoje.size();

        List<AgendaDiariaResponse> agenda = new ArrayList<>();

        for (int i = 0; i < 7; i++) {

            LocalDate dia = hoje.plusDays(i);

            AgendaDiariaResponse diaAgenda = new AgendaDiariaResponse();

            diaAgenda.data = dia;
            diaAgenda.diaSemana = getDiaSemana(dia);
            diaAgenda.prazos = Processo.count("adminId = ?1 and prazoEmAberto = true and dataPrazo = ?2", adminId, dia);
            diaAgenda.audiencias = Audiencia.count("adminId = ?1 and status = ?2 and data = ?3", adminId, StatusEvento.AGENDADO, dia);
            diaAgenda.atendimentos = Atendimento.count("adminId = ?1 and data = ?2", adminId, dia);
            diaAgenda.andamentos = Providencia.count("adminId = ?1 and status in ('PENDENTE', 'EM_ANDAMENTO') and dataAtendimento = ?2", adminId, dia);
            diaAgenda.tarefas = Tarefa.count("adminId = ?1 and prazo = ?2 and status != ?3", adminId, dia, StatusTarefa.CONCLUIDA);

            agenda.add(diaAgenda);

        }

        response.agendaProximos7Dias = agenda;
        response.prazosHoje = Processo.count("adminId = ?1 and prazoEmAberto = true and dataPrazo = ?2", adminId, hoje);
        response.providenciasPendentes = Providencia.count("adminId = ?1 and status = ?2", adminId, StatusProvidencia.PENDENTE);
        response.recebimentosAtraso = Recebimento.count("adminId = ?1 and recebido = false and dataPrevistaRecebimento < ?2", adminId, hoje);
        response.despesasAtraso = Despesa.count("adminId = ?1 and pago = false and dataPrevistaPagamento < ?2", adminId, hoje);

        return Response.ok(response).build();

    }

    @GET
    @Path("/contagens")

    public Response contagens() {

        Long adminId = getAdminId();
        Long userId = getUserId();

        LocalDate hoje = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        Map<String, Object> contagens = new HashMap<>();

        contagens.put("notificacoesNaoLidas", Notificacao.count("usuarioId = ?1 and lida = false", userId));
        contagens.put("tarefasPendentes", Tarefa.count("adminId = ?1 and status != ?2", adminId, StatusTarefa.CONCLUIDA));
        contagens.put("providenciasPendentes", Providencia.count("adminId = ?1 and status = ?2", adminId, StatusProvidencia.PENDENTE));
        contagens.put("audienciasHoje", Audiencia.count("adminId = ?1 and status = ?2 and data = ?3", adminId, StatusEvento.AGENDADO, hoje));
        contagens.put("prazosHoje", Processo.count("adminId = ?1 and prazoEmAberto = true and dataPrazo = ?2", adminId, hoje));

        return Response.ok(contagens).build();

    }

    @GET
    @Path("/usuario")

    public Response usuarioAtual() {

        Long userId = getUserId();
        User user = User.findById(userId);
       
        Map<String, Object> response = new HashMap<>();

        response.put("id", user.id);
        response.put("nome", user.nome);
        response.put("email", user.email);
        response.put("permissao", user.permissao.name());
        response.put("nomeEscritorio", user.nomeEscritorio);

        return Response.ok(response).build();
        
    }

    private String getDiaSemana(LocalDate data) {
        String[] dias = {"Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"};
        return dias[data.getDayOfWeek().getValue() - 1];
    }
}