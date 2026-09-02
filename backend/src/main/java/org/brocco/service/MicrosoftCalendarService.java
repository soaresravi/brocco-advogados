package org.brocco.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.UriBuilder;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URLEncoder;
import java.net.http.*;

import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

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
    private static final ZoneId BRASILIA_ZONE = ZoneId.of("America/Sao_Paulo");

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
       
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new RuntimeException("invalid_grant: Refresh token ausente ou nulo.");
        }
    
        String url = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
        String body = "client_id=" + clientId + "&client_secret=" + clientSecret + "&refresh_token=" + refreshToken + "&grant_type=refresh_token";
    
        HttpRequest request = HttpRequest.newBuilder().uri(java.net.URI.create(url)).header("Content-Type", "application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(body)).build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        JsonNode json = mapper.readTree(response.body());
    
        if (response.statusCode() >= 400 || !json.has("access_token")) {
            String errorMsg = json.path("error_description").asText(response.body());
            throw new RuntimeException("invalid_grant: " + errorMsg);
        }
    
        return json.get("access_token").asText();
  
    }
  
    public String criarEvento(String refreshToken, String titulo, String descricao, LocalDate data, String hora, Long duracaoMinutos) throws Exception {

        String accessToken = renovarAccessToken(refreshToken);

        LocalDateTime startDateTime = LocalDateTime.of(data, java.time.LocalTime.parse(hora));
        LocalDateTime endDateTime = startDateTime.plusMinutes(duracaoMinutos);

        String start = startDateTime.atZone(BRASILIA_ZONE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String end = endDateTime.atZone(BRASILIA_ZONE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

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

        """, titulo, descricao, start, BRASILIA_ZONE.toString(), end, BRASILIA_ZONE.toString());

        HttpRequest request = HttpRequest.newBuilder().uri(java.net.URI.create("https://graph.microsoft.com/v1.0/me/events")).header("Authorization", "Bearer " + accessToken).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(jsonBody)).build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        JsonNode json = mapper.readTree(response.body());
        return json.get("id").asText();

    }

    public void atualizarEvento(String refreshToken, String eventId, String titulo, String descricao, LocalDate data, String hora, Long duracaoMinutos) throws Exception {

        String accessToken = renovarAccessToken(refreshToken);

        LocalDateTime startDateTime = LocalDateTime.of(data, java.time.LocalTime.parse(hora));
        LocalDateTime endDateTime = startDateTime.plusMinutes(duracaoMinutos);

        String start = startDateTime.atZone(BRASILIA_ZONE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String end = endDateTime.atZone(BRASILIA_ZONE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    
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

        """, titulo, descricao, start, BRASILIA_ZONE.toString(), end, BRASILIA_ZONE.toString());

        HttpRequest request = HttpRequest.newBuilder().uri(java.net.URI.create("https://graph.microsoft.com/v1.0/me/events/" + eventId)).header("Authorization", "Bearer " + accessToken).header("Content-Type", "application/json").method("PATCH", HttpRequest.BodyPublishers.ofString(jsonBody)).build();
        httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    }
   
    public List<Map<String, Object>> buscarEventos(String refreshToken, LocalDate dataInicio, LocalDate dataFim) throws Exception {
       
        String accessToken = renovarAccessToken(refreshToken);
        String startDateTime = dataInicio.atStartOfDay(ZoneId.of("UTC")).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String endDateTime = dataFim.atTime(23, 59, 59).atZone(ZoneId.of("UTC")).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String url = String.format("https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=%s&endDateTime=%s&$orderby=start/dateTime", startDateTime, endDateTime);

        HttpRequest request = HttpRequest.newBuilder().uri(java.net.URI.create(url)).header("Authorization", "Bearer " + accessToken).header("Content-Type", "application/json").GET().build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        System.out.println("[DEBUG Microsoft] Status Buscar Eventos: " + response.statusCode());

        if (response.statusCode() >= 400) {
            System.err.println("[DEBUG Microsoft] Body Buscar Eventos Error: " + response.body());
            throw new RuntimeException("Erro na Graph API (" + response.statusCode() + "): " + response.body());
        }

        JsonNode json = mapper.readTree(response.body());
        List<Map<String, Object>> eventos = new ArrayList<>();

        if (json.has("value") && json.get("value").isArray()) {
           
            for (JsonNode item : json.get("value")) {
           
                Map<String, Object> evento = new HashMap<>();

                evento.put("id", item.path("id").asText(""));
                evento.put("titulo", item.path("subject").asText("Sem título"));
                evento.put("descricao", item.path("body").path("content").asText(""));
                evento.put("local", item.path("location").path("displayName").asText(""));

                String startStr = item.path("start").path("dateTime").asText("");
          
                if (!startStr.isEmpty()) {
          
                    String timeZone = item.path("start").path("timeZone").asText("UTC");
                    LocalDateTime startDateTimeObj = LocalDateTime.parse(startStr.substring(0, 19), DateTimeFormatter.ISO_LOCAL_DATE_TIME);

                    if (!"America/Sao_Paulo".equals(timeZone)) {
                        ZonedDateTime zoned = startDateTimeObj.atZone(ZoneId.of(timeZone)).withZoneSameInstant(ZoneId.of("America/Sao_Paulo"));
                        evento.put("data", zoned.toLocalDate());
                        evento.put("hora", zoned.toLocalTime().toString().substring(0, 5));
                    } else {
                        evento.put("data", startDateTimeObj.toLocalDate());
                        evento.put("hora", startDateTimeObj.toLocalTime().toString().substring(0, 5));
                    }
          
                }

                eventos.add(evento);
          
            }
        }

        return eventos;
  
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