package org.brocco.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.UriBuilder;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URLEncoder;
import java.net.http.*;

import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.format.DateTimeFormatter;

import com.fasterxml.jackson.databind.*;

@ApplicationScoped
public class MicrosoftCalendarService {

    @ConfigProperty(name = "microsoft.client.id")
    String clientId;

    @ConfigProperty(name = "microsoft.client.secret")
    String clientSecret;

    @ConfigProperty(name = "microsoft.redirect.uri")
    String redirectUri;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public String gerarAuthUrl(String userId) {
        String scope = "https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read offline_access";
        return UriBuilder.fromUri("https://login.microsoftonline.com/common/oauth2/v2.0/authorize").queryParam("client_id", clientId).queryParam("response_type", "code").queryParam("redirect_uri", redirectUri).queryParam("scope", scope).queryParam("state", userId).queryParam("response_mode", "query").build().toString();
    }

    public String[] trocarCodigoPorToken(String code) throws Exception {

        String url = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
        String body = "client_id=" + clientId + "&client_secret=" + clientSecret + "&code=" + code + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) + "&grant_type=authorization_code";
    
        HttpRequest request = HttpRequest.newBuilder().uri(java.net.URI.create(url)).header("Content-Type", "application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(body)).build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode json = mapper.readTree(response.body());
    
        String refreshToken = json.has("refresh_token") ? json.get("refresh_token").asText() : null;
        String accessToken = json.get("access_token").asText();
        String email = buscarEmailUsuario(accessToken);
    
        return new String[]{refreshToken, email, accessToken};
    
    }

    public String buscarEmailUsuario(String accessToken) throws Exception {

        HttpRequest request = HttpRequest.newBuilder().uri(java.net.URI.create("https://graph.microsoft.com/v1.0/me")).header("Authorization", "Bearer " + accessToken).GET().build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        JsonNode json = mapper.readTree(response.body());

        if (json.has("mail") && !json.get("mail").asText().isEmpty()) {
            return json.get("mail").asText();
        } else if (json.has("userPrincipalName")) {
            return json.get("userPrincipalName").asText();
        }

        return json.get("email").asText();

    }

    public String renovarAccessToken(String refreshToken) throws Exception {

        String url = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
        String body = "client_id=" + clientId + "&client_secret=" + clientSecret + "&refresh_token=" + refreshToken + "&grant_type=refresh_token";

        HttpRequest request = HttpRequest.newBuilder().uri(java.net.URI.create(url)).header("Content-Type", "application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(body)).build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        JsonNode json = mapper.readTree(response.body());
        return json.get("access_token").asText();

    };

    public String criarEvento(String refreshToken, String titulo, String descricao, LocalDate data, String hora, Long duracaoMinutos) throws Exception {

        String accessToken = renovarAccessToken(refreshToken);

        LocalDateTime startDateTime = LocalDateTime.of(data, java.time.LocalTime.parse(hora));
        LocalDateTime endDateTime = startDateTime.plusMinutes(duracaoMinutos);

        String start = startDateTime.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String end = endDateTime.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        String jsonBody = String.format("""

            {
                
                "subject": "%s",
                
                "body": {
                    "contentType": "text",
                    "content": "%s"
                },
                
                "start": {
                    "dateTime": "%s",
                    "timeZone": "%s"
                },
                
                "end": {
                    "dateTime": "%s",
                    "timeZone": "%s"
                }

            }

        """, titulo, descricao, start, ZoneId.systemDefault().toString(), end, ZoneId.systemDefault().toString());

        HttpRequest request = HttpRequest.newBuilder().uri(java.net.URI.create("https://graph.microsoft.com/v1.0/me/events")).header("Authorization", "Bearer " + accessToken).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(jsonBody)).build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        JsonNode json = mapper.readTree(response.body());
        return json.get("id").asText();

    }

    public void atualizarEvento(String refreshToken, String eventId, String titulo, String descricao, LocalDate data, String hora, Long duracaoMinutos) throws Exception {

        String accessToken = renovarAccessToken(refreshToken);

        LocalDateTime starDateTime = LocalDateTime.of(data, java.time.LocalTime.parse(hora));
        LocalDateTime enDateTime = starDateTime.plusMinutes(duracaoMinutos);

        String start = starDateTime.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String end = enDateTime.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        String jsonBody = String.format("""

            {
            
                "subject": "%s",
            
                "body": {
                    "contentType": "text",
                    "content": "%s"
                },
            
                "start": {
                    "dateTime": "%s",
                    "timeZone": "%s"
                },
            
                "end": {
                    "dateTime": "%s",
                    "timeZone": "%s"
                }

            }

        """, titulo, descricao, start, ZoneId.systemDefault().toString(), end, ZoneId.systemDefault().toString());

        HttpRequest request = HttpRequest.newBuilder().uri(java.net.URI.create("https://graph.microsoft.com/v1.0/me/events/" + eventId)).header("Authorization", "Bearer " + accessToken).header("Content-Type", "application/json").method("PATCH", HttpRequest.BodyPublishers.ofString(jsonBody)).build();
        httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    }

    public void deletarEvento(String refreshToken, String eventId) throws Exception {
        String accessToken = renovarAccessToken(refreshToken);
        HttpRequest request = HttpRequest.newBuilder().uri(java.net.URI.create("https://graph.microsoft.com/v1.0/me/events/" + eventId)).header("Authorization", "Bearer " + accessToken).DELETE().build();
        httpClient.send(request, HttpResponse.BodyHandlers.ofString());   
    }

    public boolean isTokenExpirado(Exception e) {
        return e.getMessage() != null && (e.getMessage().contains("invalid_grant") || e.getMessage().contains("InvalidAuthenticationToken"));
    }
    
}