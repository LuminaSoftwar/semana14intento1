package com.upn.observatorio.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InicioController {
    @GetMapping("/") public String inicio() { return "index"; }
    @GetMapping("/ciudadano") public String ciudadano() { return "ciudadano"; }
    @GetMapping("/investigador") public String investigador() { return "redirect:/dashboard"; }
    @GetMapping("/ciudadano/mapa") public String mapaCiudadano() { return "ciudadano-mapa"; }
    @GetMapping("/ciudadano/comparar") public String compararCiudadano() { return "ciudadano-comparar"; }
    @GetMapping("/ciudadano/orientacion") public String orientacionCiudadano() { return "ciudadano-orientacion"; }
    @GetMapping("/dashboard") public String dashboard() { return "dashboard"; }
    @GetMapping("/indicadores") public String indicadores() { return "indicadores"; }
    @GetMapping("/resultados") public String resultados() { return "resultados"; }
    @GetMapping("/comparaciones") public String comparaciones() { return "comparaciones"; }
    @GetMapping("/mapa") public String mapa() { return "mapa"; }
    @GetMapping("/ayuda") public String ayuda() { return "ayuda"; }
}
