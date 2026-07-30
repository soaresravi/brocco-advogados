package org.brocco.dto.response;

public class GoogleTokenResponse {
    
    public boolean connected;
    public String email;

    public GoogleTokenResponse() {}

    public GoogleTokenResponse(boolean connected, String email) {
        this.connected = connected;
        this.email = email;
    }
}