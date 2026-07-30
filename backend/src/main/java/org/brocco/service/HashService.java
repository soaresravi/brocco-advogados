package org.brocco.service;

import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class HashService {
    
    public String gerarHash(String senhaOriginal) {
        return BcryptUtil.bcryptHash(senhaOriginal);
    }

    public boolean verificarSenha(String senhaDigitada, String hashSalvo) {
        return BcryptUtil.matches(senhaDigitada, hashSalvo);
    }
}
