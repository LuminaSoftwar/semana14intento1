package com.upn.observatorio.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;
/** Sin registros artificiales: las pantallas antiguas deben mostrar sin datos. */
@Configuration
public class DatosDemostracionConfig {
 @Bean public DatosDemostracion datosDemostracion(){return new DatosDemostracion(List.of(),List.of(),List.of(),List.of());}
}
