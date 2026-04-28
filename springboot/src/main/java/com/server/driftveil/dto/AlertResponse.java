package com.server.driftveil.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Java equivalent of Python's AlertResponseModel (Pydantic).
 * Used as structured output from Gemini for root-cause analysis.
 *
 * Maps to the JSON schema that Gemini returns when asked to diagnose drift.
 */
public record AlertResponse(

        @JsonProperty("title")
        String title,

        @JsonProperty("eta_days")
        int etaDays,

        @JsonProperty("action")
        String action,

        @JsonProperty("severity")
        String severity,

        @JsonProperty("confidence")
        String confidence,

        @JsonProperty("diagnosis_raw")
        String diagnosisRaw

) {
    /** Static factory — builds a safe offline fallback when no API key is configured. */
    public static AlertResponse offlineFallback() {
        return new AlertResponse(
                "Drift Detected (Demo Mode)",
                7,
                "Check sensors. No GEMINI_API_KEY configured — running in offline demo mode.",
                "medium",
                "low",
                "### Offline Heuristics Engine\n\n" +
                "**Live AI Inference Disabled**: No `GEMINI_API_KEY` was found in environment. " +
                "Falling back to static demo heuristics.\n\n" +
                "* Suspected Mode: Early Bearing Wear\n" +
                "* Severity: Medium\n" +
                "* Confidence: 85%\n" +
                "* ETA to Failure: 7-14 days"
        );
    }

    /** Static factory — builds an error fallback when Gemini call fails. */
    public static AlertResponse errorFallback() {
        return new AlertResponse(
                "Drift Detected (Static Demo)",
                7,
                "Inspect equipment. AI inference failed — check logs for details.",
                "medium",
                "medium",
                "### Offline Heuristics Engine\n\n" +
                "**Live AI Inference Failed**: Gemini returned an error. " +
                "Falling back to static demo heuristics.\n\n" +
                "* Suspected Mode: Early Bearing Wear\n" +
                "* Severity: Medium\n" +
                "* ETA to Failure: 7-14 days"
        );
    }
}
