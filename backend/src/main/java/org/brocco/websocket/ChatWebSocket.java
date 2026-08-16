package org.brocco.websocket;

import org.brocco.entity.Mensagem;
import org.brocco.service.MensagemService;

import jakarta.inject.Inject;

import jakarta.websocket.*;
import jakarta.websocket.server.*;

import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/chat/{userId}")
public class ChatWebSocket {
    
    private static final ConcurrentHashMap<Long, Session> sessions = new ConcurrentHashMap<>();

    @Inject
    MensagemService mensagemService;

    @OnOpen
    public void onOpen(Session session, @PathParam("userId") Long userId) {
        sessions.put(userId, session);
        System.out.println("Usuário " + userId + " conectado ao chat");
    }

    @OnMessage
    public void onMessage(String message, Session session, @PathParam("userId") Long remetenteId) {
   
        try {
            
            com.google.gson.JsonObject json = com.google.gson.JsonParser.parseString(message).getAsJsonObject();
    
            Long destinatarioId = json.get("destinatarioId").getAsLong();
            String conteudo = json.get("conteudo").getAsString();
            
            boolean notifyOnly = json.has("notifyOnly") && json.get("notifyOnly").getAsBoolean();
            Mensagem mensagem;
           
            if (notifyOnly) {
                mensagem = new Mensagem();
                mensagem.remetenteId = remetenteId;
                mensagem.destinatarioId = destinatarioId;
                mensagem.conteudo = conteudo;
                mensagem.createdAt = java.time.LocalDateTime.now();
            } else {
                mensagem = mensagemService.salvar(remetenteId, destinatarioId, conteudo);
            }
    
            Session destSession = sessions.get(destinatarioId);
          
            if (destSession != null && destSession.isOpen()) {
                com.google.gson.JsonObject response = new com.google.gson.JsonObject();
                response.addProperty("id", mensagem.id != null ? mensagem.id : 0);
                response.addProperty("remetenteId", remetenteId);
                response.addProperty("conteudo", conteudo);
                response.addProperty("createdAt", mensagem.createdAt.toString());
                destSession.getBasicRemote().sendText(response.toString());
            }
    
        } catch (Exception e) {
            System.err.println("Erro ao processar mensagem: " + e.getMessage());
        }

    }
    
    @OnClose
    public void onClose(Session session, @PathParam("userId") Long userId) {
        sessions.remove(userId);
        System.out.println("Usuário " + userId + " desconectado do chat");
    }

    @OnError
    public void onError(Session session, Throwable error) {
        System.err.println("Erro no WebSocket: " + error.getMessage());
    }
}
