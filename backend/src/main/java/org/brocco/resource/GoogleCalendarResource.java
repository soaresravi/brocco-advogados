package org.brocco.resource;

import org.brocco.dto.response.*;
import org.brocco.entity.User;
import org.brocco.service.*;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/auth/google")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class GoogleCalendarResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    GoogleCalendarService googleService;

    @Inject
    AtividadeLogService logService;

    @Context
    HttpHeaders httpHeaders;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    private String getUserAgent() {
        return httpHeaders.getHeaderString("User-Agent");
    }

    private String getClientIp() {

        String ip = httpHeaders.getHeaderString("X-Forwarded-For");

        if (ip != null && !ip.isEmpty()) {
            return ip.split(",")[0].trim();
        }

        ip = httpHeaders.getHeaderString("X-Real-IP");

        if (ip != null && !ip.isEmpty()) {
            return ip;
        }

        return null;

    }

    @GET
    @Path("/auth-url")
    @RolesAllowed("USER")

    public Response getAuthUrl() {
        String url = googleService.gerarAuthUrl(getUserId().toString());
        return Response.ok(new GoogleAuthUrlResponse(url)).build();
    }

    @GET
    @Path("/callback")
    @Transactional

    public Response callback(@QueryParam("code") String code, @QueryParam("state") String state) {

        try {

            if (code == null || state == null) {
                return Response.seeOther(java.net.URI.create("http://localhost:5173/callback/google?error=1")).build();
            }

            String[] tokens = googleService.trocarCodigoPorToken(code);
            String refreshToken = tokens[0];
            String googleEmail = tokens[1];

            Long userId = Long.parseLong(state);
            User user = User.findById(userId);

            if (user != null) {
                user.googleRefreshToken = refreshToken;
                user.googleEmail = googleEmail;
                user.persist();
            }

            return Response.seeOther(java.net.URI.create("http://localhost:5173/callback/google?success=1")).build();

        } catch (Exception e) {
            return Response.seeOther(java.net.URI.create("http://localhost:5173/callback/google?error=1")).build();
        }

    }

    @GET
    @Path("/status")
    @RolesAllowed("USER")

    public Response getStatus() {
        User user = User.findById(getUserId());
        boolean connected = user.googleRefreshToken != null && !user.googleRefreshToken.isEmpty();
        return Response.ok(new GoogleTokenResponse(connected, user.googleEmail)).build();
    }

    @DELETE
    @Path("/disconnect")
    @RolesAllowed("USER")
    @Transactional

    public Response disconnect() {

        User user = User.findById(getUserId());

        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        String emailGoogle = user.googleEmail;

        user.googleRefreshToken = null;
        user.googleEmail = null;

        user.persist();
        logService.registrar(getUserId(),"UPDATE","Usuário", user.id, "Desconectou o Google Agenda. Conta: " + (emailGoogle != null ? emailGoogle : "desconhecida"), getClientIp(), getUserAgent());
        return Response.noContent().build();

    }
}