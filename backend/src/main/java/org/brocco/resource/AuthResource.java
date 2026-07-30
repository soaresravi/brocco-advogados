package org.brocco.resource;

import org.brocco.dto.request.*;
import org.brocco.dto.response.*;
import org.brocco.entity.User;
import org.brocco.enums.Permissao;
import org.brocco.service.*;
import org.brocco.util.ErroResponse;

import jakarta.annotation.security.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Map;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class AuthResource {
    
    @Inject
    HashService hashService;

    @Inject
    TokenService tokenService;

    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;

    @Context
    UriInfo uriInfo;

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

    @POST
    @PermitAll
    @Transactional
    @Path("/setup-admin")

    public Response criarAdmin(@Valid RegisterRequest request) {
        
        long count = User.count();

        if (count > 0) {
            return Response.status(409).entity(new ErroResponse(409, "Conflito", "Sistema já possui um administrador cadastrado", uriInfo.getPath())).build();
        }

        User existingUser = User.find("email", request.email).firstResult();

        if (existingUser != null) {
            return Response.status(409).entity(new ErroResponse(409, "Conflito", "Email já cadastrado", uriInfo.getPath())).build();
        }

        User user = new User();

        user.nome = request.nome;
        user.email = request.email;
        user.nomeEscritorio = request.nomeEscritorio;
        user.senha = hashService.gerarHash(request.senha);
        user.permissao = Permissao.ADMIN;
        user.adminId = null;
        
        user.persist();
        String token = tokenService.gerarToken(user);
        return Response.status(Response.Status.CREATED).entity(new LoginResponse(token, user.id, user.nome, user.email, user.permissao.name(), user.nomeEscritorio)).build();
    
    }

    @POST
    @PermitAll
    @Path("/login")

    public Response login(@Valid LoginRequest request) {
        
        User user = User.find("email", request.email).firstResult();
        
        if (user == null || !hashService.verificarSenha(request.senha, user.senha)) {
            return Response.status(Response.Status.UNAUTHORIZED).entity(new ErroResponse(401, "Não autorizado", "Credenciais inválidas", uriInfo.getPath())).build();
        }
        
        String token = tokenService.gerarToken(user);
        return Response.ok(new LoginResponse(token, user.id, user.nome, user.email, user.permissao.name(), user.nomeEscritorio)).build();
    
    }

    @GET
    @RolesAllowed("USER")
    @Path("/me")

    public Response getCurrentUser() {

        User user = User.findById(getUserId());

        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(new UserResponse(user.id, user.nome, user.email, user.permissao.name(), user.nomeEscritorio)).build();

    }

    @PUT
    @Path("/perfil")
    @RolesAllowed("USER")
    @Transactional

    public Response atualizarPerfil(@Valid AtualizarPerfilRequest request) {

        User user = User.findById(getUserId());

        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        String nomeAntigo = user.nome;
        String emailAntigo = user.email;
        String escritorioAntigo = user.nomeEscritorio;

        if (!user.email.equals(request.email)) {

            User existingUser = User.find("email = ?1 and id != ?2", request.email, getUserId()).firstResult();

            if (existingUser != null) {
                return Response.status(409).entity(new ErroResponse(409, "Conflito", "Email já cadastrado", uriInfo.getPath())).build();
            }

            user.email = request.email;

        }

        user.nome = request.nome;
        user.nomeEscritorio = request.nomeEscritorio;
        
        user.persist();
        logService.registrar(getUserId(), "UPDATE", "Usuário", user.id, "Atualizou perfil: " + nomeAntigo + " -> " + user.nome + " | Email: " + emailAntigo + " -> " + user.email + " | Escritório: " + escritorioAntigo + " -> " + user.nomeEscritorio, getClientIp(), getUserAgent());
        return Response.ok(Map.of("message", "Perfil atualizado com sucesso", "user", Map.of("id", user.id, "nome", user.nome, "email", user.email, "nomeEscritorio", user.nomeEscritorio, "permissao", user.permissao.name()))).build();
    
    }

    @PUT
    @Path("/alterar-senha")
    @RolesAllowed("USER")
    @Transactional

    public Response alterarSenha(@Valid AlterarSenhaRequest request) {

        User user = User.findById(getUserId());

        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (!hashService.verificarSenha(request.senhaAtual, user.senha)) {
            return Response.status(Response.Status.UNAUTHORIZED).entity(new ErroResponse(401, "Não autorizado", "Senha atual incorreta", uriInfo.getPath())).build();
        }

        if (!request.novaSenha.equals(request.confirmarSenha)) {
            return Response.status(Response.Status.BAD_REQUEST).entity(new ErroResponse(400, "Erro de validação", "Nova senha e confirmação não coincidem", uriInfo.getPath())).build();
        }

        user.senha = hashService.gerarHash(request.novaSenha);
        
        user.persist();
        logService.registrar(getUserId(), "UPDATE", "Usuário", user.id, "Alterou a senha da conta", getClientIp(), getUserAgent());
        return Response.ok(Map.of("message", "Senha alterada com sucesso")).build();
    
    }

    @DELETE
    @Path("/conta")
    @RolesAllowed("USER")
    @Transactional

    public Response deletarConta(@Valid DeletarContaRequest request) {

        User user = User.findById(getUserId());

        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (!hashService.verificarSenha(request.senha, user.senha)) {
            return Response.status(Response.Status.UNAUTHORIZED).entity(new ErroResponse(401, "Não autorizado", "Senha incorreta", uriInfo.getPath())).build();
        }

        String email = user.email;
        Long userId = user.id;

        if (user.isAdmin()) {
            User.delete("adminId", userId);
        }

        logService.registrar(userId, "DELETE", "Usuário", userId, "Excluiu permanentemente a conta: " + email + (user.isAdmin() ? " (e todos os usuários vinculados)" : ""), getClientIp(), getUserAgent());
        user.delete();
        return Response.ok(Map.of("message", "Conta excluída com sucesso")).build();
    }
}
