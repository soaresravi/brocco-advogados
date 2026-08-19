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
import java.util.Map;

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
                return Response.seeOther(URI.create("http://localhost:5173/callback/microsoft?error=1")).build();
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

            return Response.seeOther(URI.create("http://localhost:5173/callback/microsoft?success=1")).build();

        } catch (Exception e) {
            e.printStackTrace();
            return Response.seeOther(URI.create("http://localhost:5173/callback/microsoft?error=1")).build();
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