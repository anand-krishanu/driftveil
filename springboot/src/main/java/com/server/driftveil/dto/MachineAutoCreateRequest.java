package com.server.driftveil.dto;

import lombok.Data;

@Data
public class MachineAutoCreateRequest {
    private String machine_type;
    private String machine_id;
    private String name;
    private String line;
    private String location;
    private String scenario = "NORMAL";
    private int points = 200;
}
