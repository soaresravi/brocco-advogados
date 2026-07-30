package org.brocco.service;

import org.brocco.entity.User;

import io.smallrye.jwt.build.Jwt;
import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.Duration;
import java.util.Set;

@ApplicationScoped
public class TokenService {
    
    @Inject
    JWTParser jwtParser;

    public String gerarToken(User user) {
        return Jwt.issuer("brocco-advogados").subject(user.id.toString()).upn(user.email).claim("nome", user.nome).claim("adminId", user.adminId != null ? user.adminId : user.id).claim("permissao", user.permissao.name()).groups(Set.of(user.permissao.name(), "USER")).expiresIn(Duration.ofDays(1)).sign();
    }

    public JsonWebToken validarToken(String token) throws ParseException {
        return jwtParser.parse(token);
    }

    public Long getUserIdFromToken(String token) {

        try {
            JsonWebToken jwt = validarToken(token);
            return Long.parseLong(jwt.getSubject());
        } catch (ParseException error) {
            return null;
        }

    }

    public String getEmailFromToken(String token) {

        try {
            JsonWebToken jwt = validarToken(token);
            return jwt.getName();
        } catch (ParseException error) {
            return null;
        }

    }
}