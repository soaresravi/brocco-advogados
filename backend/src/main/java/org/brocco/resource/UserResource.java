package org.brocco.resource;

import org.brocco.dto.request.*;
import org.brocco.dto.response.*;
import org.brocco.entity.User;
import org.brocco.enums.Permissao;
import org.brocco.service.*;
import org.brocco.util.ErroResponse;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;
import java.util.stream.Collectors;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("ADMIN")

public class UserResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    HashService hashService;

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

    private Long getAdminId() {
        User currentUser = User.findById(getUserId());
        return currentUser.adminId != null ? currentUser.adminId : currentUser.id;
    }

    @GET

    public Response listarUsuarios(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size) {

        Long adminId = getAdminId();

        List<User> users = User.find("(adminId = ?1 or (id = ?1 and adminId is null))", adminId).page(page, size).list();
        long total = User.find("(adminId = ?1 or (id = ?1 and adminId is null))", adminId).count();
        
        List<UserResponse> responses = users.stream().map(u -> new UserResponse(u.id, u.nome, u.email, u.permissao.name(), u.nomeEscritorio)).collect(Collectors.toList());
        return Response.ok(new PageResponse<>(responses, total, page, size)).build();
    
    }

    @GET
    @Path("/{id}")

    public Response buscarUsuario(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        User user = User.find("id = ?1 and (adminId = ?2 or (id = ?2 and adminId is null))", id, adminId).firstResult();

        if (user == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Usuário não encontrado", uriInfo.getPath())).build();
        }

        return Response.ok(new UserResponse(user.id, user.nome, user.email, user.permissao.name(),user.nomeEscritorio)).build();

    }

    @POST
    @Transactional

    public Response criarUsuario(@Valid CreateUserRequest request) {
        
        Long adminId = getAdminId();
        User existingUser = User.find("email", request.email).firstResult();

        if (existingUser != null) {
            return Response.status(409).entity(new ErroResponse(409, "Conflito", "Email já cadastrado", uriInfo.getPath())).build();
        }

        Permissao permissao;

        try {
            permissao = Permissao.valueOf(request.permissao.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Response.status(400).entity(new ErroResponse(400, "Erro de validação", "Permissão inválida. Use: ADMIN, EDIT OU READ", uriInfo.getPath())).build();
        }

        if (permissao == Permissao.ADMIN) {
            return Response.status(400).entity(new ErroResponse(400, "Erro de validação", "Não é possível criar outro administrador", uriInfo.getPath())).build();
        }

        User user = new User();

        user.nome = request.nome;
        user.email = request.email;
        user.senha = hashService.gerarHash(request.senha);
        user.permissao = permissao;
        user.adminId = adminId;
        User admin = User.findById(adminId);
        user.nomeEscritorio = admin != null ? admin.nomeEscritorio : "Escritório";

        user.persist();
        logService.registrar(getUserId(),"CREATE","Usuário", user.id, "Criou usuário: " + user.nome + " (" + user.email + ") com permissão " + permissao.getDescricao(), getClientIp(), getUserAgent());
        return Response.status(Response.Status.CREATED).entity(new UserResponse(user.id, user.nome, user.email, user.permissao.name(), user.nomeEscritorio)).build();
    
    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizarUsuario(@PathParam("id") Long id, @Valid UpdateUserRequest request) {

        Long adminId = getAdminId();
        User user = User.find("id = ?1 and (adminId = ?2 or (id = ?2 and adminId is null))", id, adminId).firstResult();

        if (user == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Usuário não encontrado", uriInfo.getPath())).build();
        }

        if (user.isAdmin() && user.id.equals(adminId)) {
            return Response.status(400).entity(new ErroResponse(400, "Erro de validação", "Não é possível alterar o administrador principal", uriInfo.getPath())).build();
        }

        String nomeAntigo = user.nome;
        String emailAntigo = user.email;
        String permissaoAntiga = user.permissao.name();

        if (request.nome != null && !request.nome.isEmpty()) {
            user.nome = request.nome;
        }

        if (request.email != null && !request.email.isEmpty()) {
            
            User existingUser = User.find("email = ?1 and id != ?2", request.email, user.id).firstResult();

            if (existingUser != null) {
                return Response.status(409).entity(new ErroResponse(409, "Conflito", "Email já cadastrado por outro usuário", uriInfo.getPath())).build();
            }

            user.email = request.email;

        }

        if (request.senha != null && !request.senha.isEmpty()) {
            user.senha = hashService.gerarHash(request.senha);
        }

        if (request.permissao != null && !request.permissao.isEmpty()) {

            try {

                Permissao novaPermissao = Permissao.valueOf(request.permissao.toUpperCase());

                if (novaPermissao == Permissao.ADMIN) {
                    return Response.status(400).entity(new ErroResponse(400, "Erro de validação", "Não é possível atribuir permissão de administrador", uriInfo.getPath())).build();
                }

                user.permissao = novaPermissao;

            } catch (IllegalArgumentException e) {
                return Response.status(400).entity(new ErroResponse(400, "Erro de validação", "Permissão inválida. Use: EDIT ou READ", uriInfo.getPath())).build();
            }
        }

        user.persist();
        logService.registrar(getUserId(),"UPDATE","Usuário", user.id, "Atualizou usuário: " + nomeAntigo + " -> " + user.nome + " | Email: " + emailAntigo + " -> " + user.email + " | Permissão: " + permissaoAntiga + " -> " + user.permissao.name(), getClientIp(), getUserAgent());
        return Response.ok(new UserResponse(user.id, user.nome, user.email, user.permissao.name(), user.nomeEscritorio)).build();
    
    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletarUsuario(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        User user = User.find("id = ?1 and (adminId = ?2 or (id = ?2 and adminId is null))", id, adminId).firstResult();

        if (user == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Usuário não encontrado", uriInfo.getPath())).build();
        }

        if (user.isAdmin() && user.id.equals(adminId)) {
            return Response.status(400).entity(new ErroResponse(400, "Erros de validação", "Não é possível deletar o administrador principal", uriInfo.getPath())).build();
        }

        String nome = user.nome;
        String email = user.email;

        user.delete();
        logService.registrar(getUserId(),"DELETE","Usuário", id, "Deletou usuário: " + nome + " (" + email + ")", getClientIp(), getUserAgent());
        return Response.noContent().build();
    }

    @GET
    @Path("/simples")
    @RolesAllowed("USER")

    public Response listarUsuariosSimples() {
       
        Long adminId = getAdminId();
       
        List<User> users = User.find("(adminId = ?1 or (id = ?1 and adminId is null))", adminId).list();
        List<UsuarioSimplesResponse> responses = users.stream().map(u -> new UsuarioSimplesResponse(u.id, u.nome, u.email, u.permissao.name())).collect(Collectors.toList());
    
        return Response.ok(responses).build();
    
    }
}