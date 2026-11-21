package com.upn.observatorio.config;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
@Configuration
public class SecurityConfig {
 @Bean PasswordEncoder encoder(){return new BCryptPasswordEncoder();}
 @Bean UserDetailsService users(@Value("${ADMIN_USERNAME:admin}") String username,@Value("${ADMIN_PASSWORD:}") String password,PasswordEncoder encoder){
  if(password.isBlank())return new InMemoryUserDetailsManager();
  return new InMemoryUserDetailsManager(User.withUsername(username).password(encoder.encode(password)).roles("ADMIN").build());
 }
 @Bean SecurityFilterChain filter(HttpSecurity http)throws Exception{
  http.csrf(c->c.ignoringRequestMatchers("/api/visitas/pulso"));
  http.authorizeHttpRequests(a->a.requestMatchers("/admin", "/admin/**").hasRole("ADMIN").anyRequest().permitAll())
    .formLogin(f->f.loginPage("/login").defaultSuccessUrl("/admin",true).permitAll())
    .logout(l->l.logoutSuccessUrl("/").permitAll());
  return http.build();
 }
}
