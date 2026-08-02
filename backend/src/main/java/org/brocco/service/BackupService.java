package org.brocco.service;

import org.brocco.entity.*;
import org.brocco.enums.*;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.*;
import java.nio.file.*;

import java.time.*;
import java.time.format.DateTimeFormatter;

import java.util.*;
import java.util.zip.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@ApplicationScoped
public class BackupService {
    
    @Inject
    AtividadeLogService logService;

    @ConfigProperty(name = "backups.directory", defaultValue = "./backups")
    String BACKUP_DIR;

    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule()).enable(SerializationFeature.INDENT_OUTPUT).disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Transactional
    public byte[] gerarBackup(Long adminId) throws IOException {

        Files.createDirectories(Paths.get(BACKUP_DIR));
        Map<String, Object> backup = new HashMap<>();

        backup.put("adminId", adminId);
        backup.put("dataBackup", LocalDateTime.now());
        backup.put("versao", "1.0");
        backup.put("clientes", Cliente.list("adminId", adminId));
        backup.put("processos", Processo.list("adminId", adminId));
        backup.put("movimentacoes", Movimentacao.list("processo.adminId = ?1", adminId));
        backup.put("audiencias", Audiencia.list("adminId", adminId));
        backup.put("atendimentos", Atendimento.list("adminId", adminId));
        backup.put("providencias", Providencia.list("adminId", adminId));
        backup.put("tarefas", Tarefa.list("adminId", adminId));
        backup.put("recebimentos", Recebimento.list("adminId", adminId));
        backup.put("despesas", Despesa.list("adminId", adminId));
        backup.put("notificacoes", Notificacao.list("usuarioId in (select id from User where adminId = ?1 or (id = ?1 and adminId is null))", adminId));
        backup.put("mensagens", Mensagem.list("remetenteId in (select id from User where adminId = ?1 or (id = ?1 and adminId is null)) or destinatarioId in (select id from User where adminId = ?1 or (id = ?1 and adminId is null))", adminId));

        byte[] jsonData = mapper.writeValueAsBytes(backup);

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = "backup_admin_" + adminId + "_" + timestamp + ".zip";

        Path zipPath = Paths.get(BACKUP_DIR, fileName);

        try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(zipPath))) {
            ZipEntry entry = new ZipEntry("dados.json");
            zos.putNextEntry(entry);
            zos.write(jsonData);
            zos.closeEntry();
        }

        return Files.readAllBytes(zipPath);
        
    }

    public List<Map<String, Object>> listarBackups(Long adminId) throws IOException {

        Files.createDirectories(Paths.get(BACKUP_DIR));
        List<Map<String, Object>> backups = new ArrayList<>();

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(Paths.get(BACKUP_DIR), path -> path.toString().contains("admin_" + adminId) && path.toString().endsWith(".zip"))) {

            for (Path path : stream) {

                Map<String, Object> info = new HashMap<>();

                info.put("nome", path.getFileName().toString());
                info.put("tamanho", Files.size(path));
                info.put("data", Files.getLastModifiedTime(path).toMillis());

                backups.add(info);

            }

        }

        backups.sort((a, b) -> Long.compare((Long) b.get("data"), (Long) a.get("data")));
        return backups;

    }

    @Transactional
    public Map<String, Object> restaurarBackup(byte[] arquivoZip, Long adminId) throws IOException {

        Map<String, Object> resultado = new HashMap<>();
        List<String> erros = new ArrayList<>();

        int registrosRestaurados = 0;

        try (ByteArrayInputStream bais = new ByteArrayInputStream(arquivoZip);
            ZipInputStream zis = new ZipInputStream(bais)) {

                ZipEntry entry = zis.getNextEntry();

                if (entry == null || !entry.getName().equals("dados.json")) {
                    throw new IOException("Arquivo ZIP inválido: dados.json não encontrado");
                }

                ByteArrayOutputStream baos = new ByteArrayOutputStream();

                byte[] buffer = new byte[8192];
                int len;

                while ((len = zis.read(buffer)) > 0) {
                    baos.write(buffer, 0, len);
                }

                Map<String, Object> backup = mapper.readValue(baos.toByteArray(), Map.class);
                Long backupAdminId = ((Number) backup.get("adminId")).longValue();

                if (!backupAdminId.equals(adminId)) {
                    throw new IOException("Backup pertence a outro administrador");
                }

                List<Map<String, Object>> clientes = (List<Map<String, Object>>) backup.get("clientes");

                if (clientes != null) {

                    for (Map<String, Object> dados : clientes) {

                        try {

                            Cliente cliente = new Cliente();

                            cliente.adminId = adminId;
                            cliente.nome = (String) dados.get("nome");
                            cliente.cpf = (String) dados.get("cpf");
                            cliente.matriculaSap = (String) dados.get("matriculaSap");

                            if (dados.get("regimePrisional") != null) {
                                cliente.regimePrisional = RegimePrisional.valueOf((String) dados.get("regimePrisional"));
                            }

                            cliente.sexo = (String) dados.get("sexo");

                            if (dados.get("dataNascimento") != null) {
                                cliente.dataNascimento = LocalDate.parse((String) dados.get("dataNascimento"));
                            }

                            if (dados.get("unidadePrisional") != null) {
                                cliente.unidadePrisional = UnidadePrisional.valueOf((String) dados.get("unidadePrisional"));
                            }

                            cliente.numeroProcesso = (String) dados.get("numeroProcesso");

                            if (dados.get("reuStatus") != null) {
                                cliente.reuStatus = ReuStatus.valueOf((String) dados.get("reuStatus"));
                            }

                            cliente.crimesAcaoPenal = (String) dados.get("crimesAcaoPenal");

                            if (dados.get("comoConheceu") != null) {
                                cliente.comoConheceu = ComoConheceu.valueOf((String) dados.get("comoConheceu"));
                            }
                            
                            cliente.observacoes = (String) dados.get("observacoes");
                            
                            cliente.persist();
                            List<Map<String, Object>> contratantes = (List<Map<String, Object>>) dados.get("contratantes");

                            if (contratantes != null) {

                                for (Map<String, Object> cData : contratantes) {

                                    Contratante c = new Contratante();

                                    c.cliente = cliente;
                                    c.nome = (String) cData.get("nome");
                                    c.telefone = (String) cData.get("telefone");
                                    c.grauParentesco = (String) cData.get("grauParentesco");

                                    c.persist();
                                    registrosRestaurados++;

                                }

                            }

                            registrosRestaurados++;

                        } catch (Exception e) {
                            erros.add("Erro ao restaurar cliente: " + e.getMessage());
                        }

                    }
                }

                List<Map<String, Object>> processos = (List<Map<String, Object>>) backup.get("processos");

                if (processos != null) {

                    for (Map<String, Object> dados : processos) {

                        try {

                            Processo processo = new Processo();

                            processo.adminId = adminId;
                            processo.numeroProcesso = (String) dados.get("numeroProcesso");

                            if (dados.get("situacao") != null) {
                                processo.situacao = SituacaoProcesso.valueOf((String) dados.get("situacao"));
                            }

                            processo.matriculaSap = (String) dados.get("matriculaSap");

                            if (dados.get("regimePrisional") != null) {
                                processo.regimePrisional = RegimePrisional.valueOf((String) dados.get("regimePrisional"));
                            }

                            processo.prazoEmAberto = (Boolean) dados.get("prazoEmAberto");

                            if (dados.get("dataPrazo") != null) {
                                processo.dataPrazo = LocalDate.parse((String) dados.get("dataPrazo"));
                            }

                            if (dados.get("lapsoProgressao") != null) {
                                processo.lapsoProgressao = LocalDate.parse((String) dados.get("lapsoProgressao"));
                            }

                            processo.honorarios = dados.get("honorarios") != null ? new java.math.BigDecimal(dados.get("honorarios").toString()) : null;

                            processo.persist();
                            registrosRestaurados++;

                        } catch (Exception e) {
                            erros.add("Erro ao restaurar processo: " + e.getMessage());
                        }

                    }
                }

                List<Map<String, Object>> movimentacoes = (List<Map<String, Object>>) backup.get("movimentacoes");

                if (movimentacoes != null) {

                    for (Map<String, Object> dados : movimentacoes) {

                        Movimentacao m = new Movimentacao();
                        String processoNumero = (String) dados.get("processo.numeroProcesso");
                        Processo processo = Processo.find("numeroProcesso = ?1 and adminId = ?2", processoNumero, adminId).firstResult();

                        if (processo != null) {
                            m.processo = processo;
                            m.data = LocalDate.parse((String) dados.get("data"));
                            m.descricao = (String) dados.get("descricao");
                            m.persist();
                            registrosRestaurados++;
                        }

                    }

                }

                List<Map<String, Object>> audiencias = (List<Map<String, Object>>) backup.get("audiencias");

                if (audiencias != null) {

                    for (Map<String, Object> dados : audiencias) {

                        try {

                            Audiencia audiencia = new Audiencia();
                            audiencia.adminId = adminId;

                            if (dados.get("data") != null) {
                                audiencia.data = LocalDate.parse((String) dados.get("data"));
                            }

                            audiencia.hora = (String) dados.get("hora");

                            if (dados.get("status") != null) {
                                audiencia.status = StatusEvento.valueOf((String) dados.get("status"));
                            }

                            if (dados.get("processoId") != null) {
                                audiencia.processoId = ((Number) dados.get("processoId")).longValue();
                            }

                            audiencia.processoNumero = (String) dados.get("processoNumero");
                            audiencia.detalhes = (String) dados.get("detalhes");
                            audiencia.local = (String) dados.get("local");
                            audiencia.observacoes = (String) dados.get("observacoes");
                            audiencia.googleEventId = (String) dados.get("googleEventId");

                            audiencia.persist();
                            registrosRestaurados++;

                        } catch (Exception e) {
                            erros.add("Erro ao restaurar audiência: " + e.getMessage());
                        }

                    }
                }

                List<Map<String, Object>> atendimentos = (List<Map<String, Object>>) backup.get("atendimentos");

                if (atendimentos != null) {

                    for (Map<String, Object> dados : atendimentos) {

                        try {

                            Atendimento atendimento = new Atendimento();
                            atendimento.adminId = adminId;

                            if (dados.get("data") != null) {
                                atendimento.data = LocalDate.parse((String) dados.get("data"));
                            }

                            atendimento.hora = (String) dados.get("hora");

                            if (dados.get("clienteNovo") != null) {
                                atendimento.clienteNovo = SimNao.valueOf((String) dados.get("clienteNovo"));
                            }

                            atendimento.nome = (String) dados.get("nome");
                            atendimento.assunto = (String) dados.get("assunto");
                            atendimento.telefone = (String) dados.get("telefone");
                            atendimento.email = (String) dados.get("email");

                            if (dados.get("dataProximoContato") != null) {
                                atendimento.dataProximoContato = LocalDate.parse((String) dados.get("dataProximoContato"));
                            }

                            if (dados.get("comoConheceu") != null) {
                                atendimento.comoConheceu = ComoConheceu.valueOf((String) dados.get("comoConheceu"));
                            }

                            if (dados.get("fechouContrato") != null) {
                                atendimento.fechouContrato = SimNao.valueOf((String) dados.get("fechouContrato"));
                            }

                            atendimento.valorConsulta = dados.get("valorConsulta") != null ? new java.math.BigDecimal(dados.get("valorConsulta").toString()) : java.math.BigDecimal.ZERO;
                            atendimento.observacoes = (String) dados.get("observacoes");
                            atendimento.googleEventId = (String) dados.get("googleEventId");

                            atendimento.persist();
                            registrosRestaurados++;

                        } catch (Exception e) {
                            erros.add("Erro ao restaurar atendimento: " + e.getMessage());
                        }

                    }
                }

                List<Map<String, Object>> providencias = (List<Map<String, Object>>) backup.get("providencias");

                if (providencias != null) {

                    for (Map<String, Object> dados : providencias) {

                        try {

                            Providencia providencia = new Providencia();
                            providencia.adminId = adminId;

                            if (dados.get("cliente") != null) {

                                Map<String, Object> clienteData = (Map<String, Object>) dados.get("cliente");

                                Long clienteId = ((Number) clienteData.get("id")).longValue();
                                Cliente cliente = Cliente.find("id = ?1 and adminId = ?2", clienteId, adminId).firstResult();

                                if (cliente != null) {
                                    providencia.cliente = cliente;
                                }

                            }

                            if (dados.get("dataAtendimento") != null) {
                                providencia.dataAtendimento = LocalDate.parse((String) dados.get("dataAtendimento"));
                            }

                            if (dados.get("status") != null) {
                                providencia.status = StatusProvidencia.valueOf((String) dados.get("status"));
                            }

                            List<String> itensStr = (List<String>) dados.get("itens");

                            if (itensStr != null) {

                                List<TipoProvidencia> itens = new ArrayList<>();

                                for (String item : itensStr) {
                                    itens.add(TipoProvidencia.valueOf(item));
                                }

                                providencia.itens = itens;

                            }

                            providencia.observacoes = (String) dados.get("observacoes");

                            if (dados.get("enviarParaId") != null) {
                                providencia.enviarParaId = ((Number) dados.get("enviarParaId")).longValue();
                            }

                            if (dados.get("distribuirParaId") != null) {
                                providencia.distribuirParaId = ((Number) dados.get("distribuirParaId")).longValue();
                            }

                            providencia.persist();
                            registrosRestaurados++;

                        } catch (Exception e) {
                            erros.add("Erro ao restaurar providência: " + e.getMessage());
                        }

                    }
                }

                List<Map<String, Object>> tarefas = (List<Map<String, Object>>) backup.get("tarefas");

                if (tarefas != null) {

                    for (Map<String, Object> dados : tarefas) {

                        try {

                            Tarefa tarefa = new Tarefa();

                            tarefa.adminId = adminId;
                            tarefa.tarefa = (String) dados.get("tarefa");

                            if (dados.get("status") != null) {
                                tarefa.status = StatusTarefa.valueOf((String) dados.get("status"));
                            }

                            if (dados.get("urgencia") != null) {
                                tarefa.urgencia = UrgenciaTarefa.valueOf((String) dados.get("urgencia"));
                            }

                            if (dados.get("prazo") != null) {
                                tarefa.prazo = LocalDate.parse((String) dados.get("prazo"));
                            }

                            if (dados.get("responsavelId") != null) {
                                tarefa.responsavelId = ((Number) dados.get("responsavelId")).longValue();
                            }

                            if (dados.get("processoId") != null) {
                                tarefa.processoId = ((Number) dados.get("processoId")).longValue();
                            }

                            tarefa.processoNumero = (String) dados.get("processoNumero");

                            if (dados.get("clienteId") != null) {
                                tarefa.clienteId = ((Number) dados.get("clienteId")).longValue();
                            }

                            tarefa.clienteNome = (String) dados.get("clienteNome");
                            tarefa.andamento = (String) dados.get("andamento");
                            tarefa.googleEventId = (String) dados.get("googleEventId");

                            tarefa.persist();
                            registrosRestaurados++;

                        } catch (Exception e) {
                            erros.add("Erro ao restaurar tarefa: " + e.getMessage());
                        }

                    }
                }

                List<Map<String, Object>> recebimentos = (List<Map<String, Object>>) backup.get("recebimentos");

                if (recebimentos != null) {

                    for (Map<String, Object> dados : recebimentos) {

                        try {

                            Recebimento recebimento = new Recebimento();
                            recebimento.adminId = adminId;

                            if (dados.get("dataPrevistaRecebimento") != null) {
                                recebimento.dataPrevistaRecebimento = LocalDate.parse((String) dados.get("dataPrevistaRecebimento"));
                            }

                            if (dados.get("dataRecebimento") != null) {
                                recebimento.dataRecebimento = LocalDate.parse((String) dados.get("dataRecebimento"));
                            }

                            recebimento.valor = dados.get("valor") != null ? new java.math.BigDecimal(dados.get("valor").toString()) : java.math.BigDecimal.ZERO;

                            if (dados.get("tipo") != null) {
                                recebimento.tipo = TipoRecebimento.valueOf((String) dados.get("tipo"));
                            }

                            recebimento.recebido = dados.get("recebido") != null ? (Boolean) dados.get("recebido") : false;
                            recebimento.parcela = (String) dados.get("parcela");

                            if (dados.get("clienteId") != null) {
                                recebimento.clienteId = ((Number) dados.get("clienteId")).longValue();
                            }

                            recebimento.clienteNome = (String) dados.get("clienteNome");

                            if (dados.get("processoId") != null) {
                                recebimento.processoId = ((Number) dados.get("processoId")).longValue();
                            }

                            recebimento.processoNumero = (String) dados.get("processoNumero");
                            recebimento.detalhes = (String) dados.get("detalhes");

                            recebimento.persist();
                            registrosRestaurados++;

                        } catch (Exception e) {
                            erros.add("Erro ao restaurar recebimento: " + e.getMessage());
                        }

                    }
                }

                List<Map<String, Object>> despesas = (List<Map<String, Object>>) backup.get("despesas");

                if (despesas != null) {

                    for (Map<String, Object> dados : despesas) {

                        try {

                            Despesa despesa = new Despesa();
                            despesa.adminId = adminId;

                            if (dados.get("dataPrevistaPagamento") != null) {
                                despesa.dataPrevistaPagamento = LocalDate.parse((String) dados.get("dataPrevistaPagamento"));
                            }

                            if (dados.get("dataEfetivaPagamento") != null) {
                                despesa.dataEfetivaPagamento = LocalDate.parse((String) dados.get("dataEfetivaPagamento"));
                            }

                            despesa.valor = dados.get("valor") != null ? new java.math.BigDecimal(dados.get("valor").toString()) : java.math.BigDecimal.ZERO;

                            if (dados.get("categoria") != null) {
                                despesa.categoria = CategoriaDespesa.valueOf((String) dados.get("categoria"));
                            }

                            despesa.despesa = (String) dados.get("despesa");
                            despesa.pago = dados.get("pago") != null ? (Boolean) dados.get("pago") : false;
                            despesa.detalhes = (String) dados.get("detalhes");

                            despesa.persist();
                            registrosRestaurados++;

                        } catch (Exception e) {
                            erros.add("Erro ao restaurar despesa: " + e.getMessage());
                        }

                    }
                }

                List<Map<String, Object>> notificacoes = (List<Map<String, Object>>) backup.get("notificacoes");

                if (notificacoes != null) {

                    for (Map<String, Object> dados : notificacoes) {

                        try {

                            Notificacao notificacao = new Notificacao();

                            if (dados.get("usuarioId") != null) {

                                Long usuarioId = ((Number) dados.get("usuarioId")).longValue();
                                User user = User.findById(usuarioId);

                                if (user != null && (user.adminId == null || user.adminId.equals(adminId))) {
                                    notificacao.usuarioId = usuarioId;
                                } else {
                                    continue;
                                }

                            }

                            if (dados.get("remetenteId") != null) {

                                Long remetenteId = ((Number) dados.get("remetenteId")).longValue();
                                User user = User.findById(remetenteId);

                                if (user != null && (user.adminId == null || user.adminId.equals(adminId))) {
                                    notificacao.remetenteId = remetenteId;
                                }

                            }

                            if (dados.get("tipo") != null) {
                                notificacao.tipo = TipoNotificacao.valueOf((String) dados.get("tipo"));
                            }

                            notificacao.titulo = (String) dados.get("titulo");
                            notificacao.mensagem = (String) dados.get("mensagem");
                            notificacao.lida = dados.get("lida") != null ? (Boolean) dados.get("lida") : false;

                            if (dados.get("entidadeId") != null) {
                                notificacao.entidadeId = ((Number) dados.get("entidadeId")).longValue();
                            }

                            notificacao.entidadeTipo = (String) dados.get("entidadeTipo");
                            notificacao.link = (String) dados.get("link");

                            notificacao.persist();
                            registrosRestaurados++;

                        } catch (Exception e) {
                            erros.add("Erro ao restaurar notificação: " + e.getMessage());
                        }

                    }
                }

                List<Map<String, Object>> mensagens = (List<Map<String, Object>>) backup.get("mensagens");

                if (mensagens != null) {
                    
                    for (Map<String, Object> dados : mensagens) {

                        try {

                            Mensagem mensagem = new Mensagem();

                            if (dados.get("remetenteId") != null) {

                                Long remetenteId = ((Number) dados.get("remetenteId")).longValue();
                                User user = User.findById(remetenteId);

                                if (user != null && (user.adminId == null || user.adminId.equals(adminId))) {
                                    mensagem.remetenteId = remetenteId;
                                } else {
                                    continue;
                                }

                            }

                            if (dados.get("destinatarioId") != null) {

                                Long destinatarioId = ((Number) dados.get("destinatarioId")).longValue();
                                User user = User.findById(destinatarioId);

                                if (user != null && (user.adminId == null || user.adminId.equals(adminId))) {
                                    mensagem.destinatarioId = destinatarioId;
                                } else {
                                    continue;
                                }

                            }

                            mensagem.conteudo = (String) dados.get("conteudo");
                            mensagem.lida = dados.get("lida") != null ? (Boolean) dados.get("lida") : false;

                            mensagem.persist();
                            registrosRestaurados++;

                        } catch (Exception e) {
                            erros.add("Erro ao restaurar mensagem: " + e.getMessage());
                        }

                    }
                }

                resultado.put("sucesso", true);
                resultado.put("mensagem", "Backup restaurado com sucesso!");
                resultado.put("registrosRestaurados", registrosRestaurados);
                resultado.put("erros", erros);
                
            } catch (Exception e) {
                resultado.put("sucesso", false);
                resultado.put("mensagem", "Erro ao restaurar backup: " + e.getMessage());
                erros.add(e.getMessage());
                resultado.put("erros", erros);
            }

            return resultado;

    }

    public void limparBackupsAntigos(Long adminId, int dias) throws IOException {

        long limite = System.currentTimeMillis() - (dias * 24L * 60 * 60 * 1000);

        try (DirectoryStream<Path> strem = Files.newDirectoryStream(
            
            Paths.get(BACKUP_DIR),
            path -> path.toString().contains("admin_" + adminId) && path.toString().endsWith(".zip"))) {

                for (Path path : strem) {
                    
                    if (Files.getLastModifiedTime(path).toMillis() < limite) {
                        Files.deleteIfExists(path);
                    }

                }

            }
    }

    public String gerarCSV(Long adminId, String entidade) throws IOException {

        StringBuilder csv = new StringBuilder();

        switch (entidade.toLowerCase()) {
            
            case "clientes":
                
                csv.append("ID;Nome;CPF;Matrícula SAP;Regime Prisional;Sexo;Data Nascimento;Unidade Prisional;Nº Processo;Réu;Como Conheceu;Observações;Data Cadastro\n");
                List<Cliente> clientes = Cliente.list("adminId", adminId);

                for (Cliente c : clientes) {
                    csv.append(c.id).append(";").append(c.nome != null ? c.nome : "").append(";").append(c.cpf != null ? c.cpf : "").append(";").append(c.matriculaSap != null ? c.matriculaSap : "").append(";").append(c.regimePrisional != null ? c.regimePrisional.getDescricao() : "").append(";").append(c.sexo != null ? c.sexo : "").append(";").append(c.dataNascimento != null ? c.dataNascimento : "").append(";").append(c.unidadePrisional != null ? c.unidadePrisional.getDescricao() : "").append(";").append(c.numeroProcesso != null ? c.numeroProcesso : "").append(";").append(c.reuStatus != null ? c.reuStatus.getDescricao() : "").append(";").append(c.comoConheceu != null ? c.comoConheceu.getDescricao() : "").append(";").append(c.observacoes != null ? c.observacoes : "").append(";").append(c.createdAt != null ? c.createdAt : "").append("\n");
                }

                break;
                
            case "processos":
                
                csv.append("ID;Nº Processo;Situação;Cliente;Matrícula SAP;Regime Prisional;Prazo em Aberto;Data Prazo;Lapso Progressão;Honorários;Data Criação\n");
                List<Processo> processos = Processo.list("adminId", adminId);

                for (Processo p : processos) {
                    csv.append(p.id).append(";").append(p.numeroProcesso != null ? p.numeroProcesso : "").append(";").append(p.situacao != null ? p.situacao.getDescricao() : "").append(";").append(p.cliente != null ? p.cliente.nome : "").append(";").append(p.matriculaSap != null ? p.matriculaSap : "").append(";").append(p.regimePrisional != null ? p.regimePrisional.getDescricao() : "").append(";").append(p.prazoEmAberto != null ? (p.prazoEmAberto ? "Sim" : "Não") : "").append(";").append(p.dataPrazo != null ? p.dataPrazo : "").append(";").append(p.lapsoProgressao != null ? p.lapsoProgressao : "").append(";").append(p.honorarios != null ? p.honorarios : "").append(";").append(p.createdAt != null ? p.createdAt : "").append("\n");
                }

                break;
            
            case "financeiro":

                csv.append("ID;Tipo;Valor;Status;Data Prevista;Data Efetiva;Cliente;Processo;Detalhes\n");
                List<Recebimento> recebimentos = Recebimento.list("adminId", adminId);

                for (Recebimento r : recebimentos) {
                    csv.append(r.id).append(";").append("Recebimento - ").append(r.tipo != null ? r.tipo.getDescricao() : "").append(";").append(r.valor != null ? r.valor : "").append(";").append(r.recebido != null ? (r.recebido ? "Recebido" : "Pendente") : "").append(";").append(r.dataPrevistaRecebimento != null ? r.dataPrevistaRecebimento : "").append(";").append(r.dataRecebimento != null ? r.dataRecebimento : "").append(";").append(r.clienteNome != null ? r.clienteNome : "").append(";").append(r.processoNumero != null ? r.processoNumero : "").append(";").append(r.detalhes != null ? r.detalhes : "").append("\n");
                }

                List<Despesa> despesas = Despesa.list("adminId", adminId);

                for (Despesa d : despesas) {
                    csv.append(d.id).append(";").append("Despesa - ").append(d.categoria != null ? d.categoria.getDescricao() : "").append(";").append(d.valor != null ? d.valor : "").append(";").append(d.pago != null ? (d.pago ? "Pago" : "Pendente") : "").append(";").append(d.dataPrevistaPagamento != null ? d.dataPrevistaPagamento : "").append(";").append(d.dataEfetivaPagamento != null ? d.dataEfetivaPagamento : "").append(";").append("").append(";").append("").append(";").append(d.detalhes != null ? d.detalhes : "").append("\n");
                }

                break;

            default:
                throw new IllegalArgumentException("Entidade inválida: " + entidade + ". Use: clientes, processos ou financeiro");
        }

        return csv.toString();

    }
}