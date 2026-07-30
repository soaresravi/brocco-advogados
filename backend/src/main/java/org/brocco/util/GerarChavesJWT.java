package org.brocco.util;

import java.nio.file.*;
import java.security.*;
import java.util.Base64;

public class GerarChavesJWT {
    
    public static void main(String[] args) throws Exception {

        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
        KeyPair keyPair = keyGen.generateKeyPair();

        PrivateKey privateKey = keyPair.getPrivate();
        PublicKey publicKey = keyPair.getPublic();

        String privateKeyPem = "-----BEGIN PRIVATE KEY-----\n" + Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(privateKey.getEncoded()) + "\n-----END PRIVATE KEY-----";
        String publicKeyPm = "-----BEGIN PUBLIC KEY-----\n" + Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(publicKey.getEncoded()) + "\n-----END PUBLIC KEY-----";
        String baseDir = System.getProperty("user.dir");
        
        Path resourcesPath = Paths.get(baseDir, "src", "main", "resources");

        if (!Files.exists(resourcesPath)) {
            Files.createDirectories(resourcesPath);
            System.out.println("Pasta resources criada em: " + resourcesPath.toAbsolutePath());
        }

        Path privatePath = resourcesPath.resolve("privateKey.pem");
        Path publicPath = resourcesPath.resolve("publicKey.pem");

        Files.writeString(privatePath, privateKeyPem);
        Files.writeString(publicPath, publicKeyPm);

        System.out.println("Chaves geradas com sucesso!");
        System.out.println("Private Key: " + privatePath.toAbsolutePath());
        System.out.println("Public Key: " + publicPath.toAbsolutePath());
    }
}
