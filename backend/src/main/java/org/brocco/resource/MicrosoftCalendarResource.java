package org.brocco.resource;

import org.brocco.entity.User;
import org.brocco.service.MicrosoftCalendarService;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.net.URI;
import java.time.LocalDate;
import java.util.*;

@Path("/auth/microsoft")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class MicrosoftCalendarResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    MicrosoftCalendarService microsoftService;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET
    @Path("/auth-url")
    @RolesAllowed("USER")

    public Response getAuthUrl() {
        String url = microsoftService.gerarAuthUrl(getUserId().toString());
        return Response.ok(Map.of("url", url)).build();
    }

    @GET
    @Path("/callback")
    @Transactional

    public Response callback(@QueryParam("code") String code, @QueryParam("state") String state) {

        try {

            if (code == null || state == null) {
                return Response.seeOther(URI.create("https://broccoadvogados.tech/oauth/microsoft?error=1")).build();
            }

            String[] tokens = microsoftService.trocarCodigoPorToken(code);
            String refreshToken = tokens[0];
            String email = tokens[1];

            Long userId = Long.parseLong(state);
            User user = User.findById(userId);

            if (user != null) {
                user.microsoftRefreshToken = refreshToken;
                user.microsoftEmail = email;
                user.persist();
            }

            return Response.seeOther(URI.create("https://broccoadvogados.tech/oauth/microsoft?success=1")).build();

        } catch (Exception e) {
            e.printStackTrace();
            return Response.seeOther(URI.create("https://broccoadvogados.tech/oauth/microsoft?error=1")).build();
        }

    }

    @GET
    @Path("/eventos")
    @RolesAllowed("USER")
    
    public Response buscarEventos(@QueryParam("dias") @DefaultValue("7") int dias) {
        
        try {
            
            User user = User.findById(getUserId());
            
            if (user.microsoftRefreshToken == null || user.microsoftRefreshToken.isEmpty()) {
                return Response.ok(Map.of("connected", false, "eventos", Collections.emptyList())).build();
            }
            
            LocalDate hoje = LocalDate.now();
            LocalDate dataFim = hoje.plusDays(dias);
            
            List<Map<String, Object>> eventos = microsoftService.buscarEventos(user.microsoftRefreshToken, hoje, dataFim);
            return Response.ok(Map.of("connected", true, "eventos", eventos)).build();
        
        } catch (Exception e) {
            System.err.println("Erro ao buscar eventos do Outlook: " + e.getMessage());
            boolean expirado = microsoftService.isTokenExpirado(e);
            return Response.ok(Map.of("connected", !expirado, "eventos", Collections.emptyList(), "erro", e.getMessage())).build();
        }
    
    }

    @GET
    @Path("/status")
    @RolesAllowed("USER")

    public Response getStatus() {
        User user = User.findById(getUserId());
        boolean connected = user.microsoftRefreshToken != null && !user.microsoftRefreshToken.isEmpty();
        String email = user.microsoftEmail != null ? user.microsoftEmail : "";
        return Response.ok(Map.of("connected", connected, "email", email)).build();
    }

    @DELETE
    @Path("/disconnect")
    @RolesAllowed("USER")
    @Transactional

    public Response disconnect() {

        User user = User.findById(getUserId());

        if (user == null) {
            return Response.status(404).build();
        }
      
        user.microsoftRefreshToken = null;
        user.microsoftEmail = null;
      
        user.persist();
        return Response.noContent().build();
    
    }
}