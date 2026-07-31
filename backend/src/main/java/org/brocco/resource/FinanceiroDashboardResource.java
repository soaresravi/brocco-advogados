package org.brocco.resource;

import org.brocco.entity.*;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Path("/financeiro/dashboard")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "EDIT"})

public class FinanceiroDashboardResource {
    
    @Inject
    JsonWebToken jwt;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    private Long getAdminId() {
        User currentUser = User.findById(getUserId());
        return currentUser.adminId != null ? currentUser.adminId : currentUser.id;
    }

    @GET
    public Response dashboard(@QueryParam("ano") Integer ano) {

        Long adminId = getAdminId();
        int anoFiltro = ano != null ? ano : LocalDate.now().getYear();

        List<Recebimento> todosRecebimentos = Recebimento.list("adminId", adminId);
        List<Despesa> todasDespesas = Despesa.list("adminId", adminId);

        Map<String, Object> dashboard = new HashMap<>();

        BigDecimal totalRecebimentosAno = todosRecebimentos.stream().filter(r -> r.dataRecebimento != null && r.dataRecebimento.getYear() == anoFiltro).filter(r -> Boolean.TRUE.equals(r.recebido)).map(r -> r.valor != null ? r.valor : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDespesasAno = todasDespesas.stream().filter(d -> d.dataEfetivaPagamento != null && d.dataEfetivaPagamento.getYear() == anoFiltro).filter(d-> Boolean.TRUE.equals(d.pago)).map(d -> d.valor != null ? d.valor : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);

        dashboard.put("ano", anoFiltro);
        dashboard.put("totalRecebimentos", totalRecebimentosAno);
        dashboard.put("totalDespesas", totalDespesasAno);
        dashboard.put("resultado", totalRecebimentosAno.subtract(totalDespesasAno));

        Map<Integer, Map<String, BigDecimal>> recebimentosPorMes = new LinkedHashMap<>();

        for (int mes = 1; mes <= 12; mes++) {

            BigDecimal recebido = BigDecimal.ZERO;
            BigDecimal naoRecebido = BigDecimal.ZERO;

            for (Recebimento r : todosRecebimentos) {

                if (Boolean.TRUE.equals(r.recebido) && r.dataRecebimento != null && r.dataRecebimento.getYear() == anoFiltro && r.dataRecebimento.getMonthValue() == mes) {
                    recebido = recebido.add(r.valor != null ? r.valor : BigDecimal.ZERO);
                } else if (!Boolean.TRUE.equals(r.recebido) && r.dataPrevistaRecebimento != null && r.dataPrevistaRecebimento.getYear() == anoFiltro && r.dataPrevistaRecebimento.getMonthValue() == mes) {
                    naoRecebido = naoRecebido.add(r.valor != null ? r.valor : BigDecimal.ZERO);
                }

            }

            Map<String, BigDecimal> valores = new HashMap<>();

            valores.put("recebido", recebido);
            valores.put("naoRecebido", naoRecebido);
            valores.put("total", recebido.add(naoRecebido));

            recebimentosPorMes.put(mes, valores);

        }

        dashboard.put("recebimentosPorMes", recebimentosPorMes);

        Map<Integer, Map<String, BigDecimal>> despesasPorMes = new LinkedHashMap<>();

        for (int mes = 1; mes <= 12; mes++) {

            BigDecimal pago = BigDecimal.ZERO;
            BigDecimal naoPago = BigDecimal.ZERO;

            for (Despesa d : todasDespesas) {

                if (Boolean.TRUE.equals(d.pago) && d.dataEfetivaPagamento != null && d.dataEfetivaPagamento.getYear() == anoFiltro && d.dataEfetivaPagamento.getMonthValue() == mes) {
                    pago = pago.add(d.valor != null ? d.valor : BigDecimal.ZERO);
                } else if (!Boolean.TRUE.equals(d.pago) && d.dataPrevistaPagamento != null && d.dataPrevistaPagamento.getYear() == anoFiltro && d.dataPrevistaPagamento.getMonthValue() == mes) {
                    naoPago = naoPago.add(d.valor != null ? d.valor : BigDecimal.ZERO);
                }

            }

            Map<String, BigDecimal> valores = new HashMap<>();

            valores.put("pago", pago);
            valores.put("naoPago", naoPago);
            valores.put("total", pago.add(naoPago));

            despesasPorMes.put(mes, valores);

        }

        dashboard.put("despesasPorMes", despesasPorMes);
        LocalDate hoje = LocalDate.now();

        BigDecimal totalAReceberHoje = todosRecebimentos.stream().filter(r -> r.dataPrevistaRecebimento != null && r.dataPrevistaRecebimento.equals(hoje)).filter(r -> !Boolean.TRUE.equals(r.recebido)).map(r -> r.valor != null ? r.valor : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAPagarHoje = todasDespesas.stream().filter(d -> d.dataPrevistaPagamento != null && d.dataPrevistaPagamento.equals(hoje)).filter(d -> !Boolean.TRUE.equals(d.pago)).map(d -> d.valor != null ? d.valor : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRecebimentosAtraso = todosRecebimentos.stream().filter(r -> r.dataPrevistaRecebimento != null && r.dataPrevistaRecebimento.isBefore(hoje)).filter(r -> !Boolean.TRUE.equals(r.recebido)).map(r -> r.valor != null ? r.valor : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDespesasAtraso = todasDespesas.stream().filter(d -> d.dataPrevistaPagamento != null && d.dataPrevistaPagamento.isBefore(hoje)).filter(d -> !Boolean.TRUE.equals(d.pago)).map(d -> d.valor != null ? d.valor : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);

        dashboard.put("totalAReceberHoje", totalAReceberHoje);
        dashboard.put("totalAPagarHoje", totalAPagarHoje);
        dashboard.put("totalRecebimentosAtraso", totalRecebimentosAtraso);
        dashboard.put("totalDespesasAtraso", totalDespesasAtraso);

        return Response.ok(dashboard).build();

    }
}