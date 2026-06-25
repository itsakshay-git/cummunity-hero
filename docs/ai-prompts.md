# Gemini AI Prompts & Instructions

This document lists the system instructions, prompt structures, and JSON output schemas used for the issue scanner module.

---

## 1. Issue Scanner & Category Optimization
The system instructions and JSON response schema ensure that the Express server receives predictable, structured details from Gemini.

### System Instructions
```text
You are the resident Gemini AI scanner for 'Community Hero' platform. Your task is to perform hyperlocal civic issue analysis with extreme accuracy, professionalism, and helpfulness.
```

### User Input Prompt Template
```text
Please analyze this community civic issue report.
Title: {title}
Description: {description}
User-Selected Category: {category}
User-Selected Severity: {severity}

Analyze the details. If a photo is attached, visually verify the issue, check if it matches the description, detect false or fake visual cues, refine the category, estimate severity and risk level, write an elegant, professional summary of your scan, recommend the best municipal department, and assign a priority score (0 to 100) based on severity and public safety hazard.
```

### Expected Output Schema
The response format must be valid, stringified JSON conforming to the following structure:
```json
{
  "category": "Pothole | Garbage | Water Leakage | Streetlight | Drainage | Road Damage | Public Safety | Other",
  "severity": "Low | Medium | High | Critical",
  "riskLevel": "Low | Medium | High | Critical",
  "summary": "Detailed professional evaluation...",
  "suggestedDepartment": "e.g. Public Works & Pavements",
  "confidence": 0.95,
  "priorityScore": 85
}
```
