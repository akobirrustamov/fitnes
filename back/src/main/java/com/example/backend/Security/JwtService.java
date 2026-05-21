package com.example.backend.Security;


import com.example.backend.Entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    /** Access token muddati: 1 soat (3600 sekund) */
    public static final long ACCESS_TOKEN_EXPIRY_SECONDS = 3600L;

    public String generateJwtToken(User user) {
        UUID id = user.getId();
        Map<String, Object> claims = new HashMap<>();
        String jwt = Jwts.builder()
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRY_SECONDS * 1000))
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setSubject(id.toString())
                .addClaims(claims)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
        return jwt;
    }

    public String generateJwtRefreshToken(User user) {
        UUID id = user.getId();
        Map<String, Object> claims = new HashMap<>();
        String jwt = Jwts.builder()
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setSubject(id.toString())
                .addClaims(claims)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
        return jwt;
    }

    public String generateTokenForSubject(String subject) {
        return Jwts.builder()
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRY_SECONDS * 1000))
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setSubject(subject)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode("333aae7133c19eda8f7f61ce07e64281c295df67681b1ed47c9c270a488f94d0");
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractSubjectFromJwt(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build().parseClaimsJws(token)
                .getBody();
        return claims.getSubject();

    }


    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build().parseClaimsJws(token)
                    .getBody();
            return true;
        } catch (Exception e) {
            return false;
        }

    }
}
