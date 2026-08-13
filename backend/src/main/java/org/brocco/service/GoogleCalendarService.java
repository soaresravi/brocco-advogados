package org.brocco.service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;

import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.*;
import java.util.*;

@ApplicationScoped
public class GoogleCalendarService {
    
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String APPLICATION_NAME = "Brocco Advogados";
    private static final List<String> SCOPES = List.of("https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/userinfo.email");

    @ConfigProperty(name = "google.client.id")
    String clientId;

    @ConfigProperty(name = "google.client.secret")
    String clientSecret;

    @ConfigProperty(name = "google.redirect.uri")
    String redirectUri;

    private GoogleAuthorizationCodeFlow createFlow() {

        GoogleClientSecrets.Details details = new GoogleClientSecrets.Details();

        details.setClientId(clientId);
        details.setClientSecret(clientSecret);
        details.setRedirectUris(Collections.singletonList(redirectUri));

        GoogleClientSecrets secrets = new GoogleClientSecrets();
        secrets.setInstalled(details);

        return new GoogleAuthorizationCodeFlow.Builder(new NetHttpTransport(), JSON_FACTORY, secrets, SCOPES).setAccessType("offline").build();
    
    }

    public String gerarAuthUrl(String userId) {
        GoogleAuthorizationCodeFlow flow = createFlow();
        return flow.newAuthorizationUrl().setRedirectUri(redirectUri).setState(userId).set("prompt", "consent").build();
    }

    public String[] trocarCodigoPorToken(String code) throws Exception {

        TokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(new NetHttpTransport(), GsonFactory.getDefaultInstance(), "https://oauth2.googleapis.com/token", clientId, clientSecret, code, redirectUri).execute();
        
        String refreshToken = tokenResponse.getRefreshToken();
        String idToken = (String) tokenResponse.get("id_token");
        String googleEmail = extrairEmailDoIdToken(idToken);
        
        return new String[]{ refreshToken, googleEmail };
    
    }

    private String extrairEmailDoIdToken(String idToken) {

        try {

            String[] partes = idToken.split("\\.");
            String payload = new String(java.util.Base64.getUrlDecoder().decode(partes[1]));

            com.google.gson.JsonObject json = com.google.gson.JsonParser.parseString(payload).getAsJsonObject();

            return json.get("email").getAsString();
            
        } catch (Exception e) {
            System.err.println("Erro ao extrair email do id_token: " + e.getMessage());
            return null;
        }

    }

    private Credential createCredential(String refreshToken) throws Exception {

        com.google.api.client.http.GenericUrl tokenServerUrl = new com.google.api.client.http.GenericUrl("https://oauth2.googleapis.com/token");

        return new Credential.Builder(
            com.google.api.client.auth.oauth2.BearerToken.authorizationHeaderAccessMethod()
        ).setTransport(new NetHttpTransport()).setJsonFactory(JSON_FACTORY).setTokenServerUrl(tokenServerUrl).setClientAuthentication(
            new com.google.api.client.auth.oauth2.ClientParametersAuthentication(clientId, clientSecret)
        ).build().setRefreshToken(refreshToken);

    }

    public String criarEvento(String refreshToken, String email, String titulo, String descricao, LocalDate data, String hora, Long duracaoMinutos) throws Exception {

        Credential credential = createCredential(refreshToken);
        Calendar service = new Calendar.Builder(new NetHttpTransport(), JSON_FACTORY, credential).setApplicationName(APPLICATION_NAME).build();

        LocalDateTime startDateTime = LocalDateTime.of(data, LocalTime.parse(hora));
        LocalDateTime enDateTime = startDateTime.plusMinutes(duracaoMinutos);

        java.time.ZonedDateTime startZoned = startDateTime.atZone(java.time.ZoneId.systemDefault());
        java.time.ZonedDateTime endZoned = enDateTime.atZone(java.time.ZoneId.systemDefault());

        EventDateTime start = new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(startZoned.toInstant().toEpochMilli()));
        EventDateTime end = new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(endZoned.toInstant().toEpochMilli()));

        Event event = new Event().setSummary(titulo).setDescription(descricao).setStart(start).setEnd(end);
        return service.events().insert("primary", event).execute().getId();

    }

    public void atualizarEvento(String refreshToken, String eventId, String titulo, String descricao, LocalDate data, String hora, Long duracaoMinutos) throws Exception {

        Credential credential = createCredential(refreshToken);
        Calendar service = new Calendar.Builder(new NetHttpTransport(), JSON_FACTORY, credential).setApplicationName(APPLICATION_NAME).build();
        Event existingEvent = service.events().get("primary", eventId).execute();

        LocalDateTime startDateTime = LocalDateTime.of(data, LocalTime.parse(hora));
        LocalDateTime enDateTime = startDateTime.plusMinutes(duracaoMinutos);

        java.time.ZonedDateTime startZoned = startDateTime.atZone(java.time.ZoneId.systemDefault());
        java.time.ZonedDateTime endZoned = enDateTime.atZone(java.time.ZoneId.systemDefault());

        existingEvent.setSummary(titulo);
        existingEvent.setDescription(descricao);
        existingEvent.setStart(new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(startZoned.toInstant().toEpochMilli())));
        existingEvent.setEnd(new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(endZoned.toInstant().toEpochMilli())));

        service.events().update("primary", eventId, existingEvent).execute();

    }

    public void deletarEvento(String refreshToken, String eventId) throws Exception {
        Credential credential = createCredential(refreshToken);
        Calendar service = new Calendar.Builder(new NetHttpTransport(), JSON_FACTORY, credential).setApplicationName(APPLICATION_NAME).build();
        service.events().delete("primary", eventId).execute();
    }

    public boolean isTokenExpirado(Exception e) {
        return e.getMessage() != null && e.getMessage().contains("invalid_grant");
    }
}
