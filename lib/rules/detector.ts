import { SensorReading, RuleViolation, RuleDetectionResult, AlertSeverity } from '@/types';

/**
 * Rule-based detection system for sensor anomalies
 * Applies threshold checks before sending to AI for diagnosis
 */

interface ThresholdRule {
    parameter: keyof SensorReading;
    min?: number;
    max?: number;
    severity: AlertSeverity;
    message: string;
}

const RULES: ThresholdRule[] = [
    // Engine temperature rules
    {
        parameter: 'engine_temp',
        max: 110,
        severity: 'HIGH',
        message: 'Engine temperature critically high'
    },
    {
        parameter: 'engine_temp',
        max: 100,
        severity: 'MEDIUM',
        message: 'Engine temperature above normal'
    },

    // Battery voltage rules
    {
        parameter: 'battery_voltage',
        min: 11.5,
        severity: 'MEDIUM',
        message: 'Battery voltage low'
    },
    {
        parameter: 'battery_voltage',
        min: 11.0,
        severity: 'HIGH',
        message: 'Battery voltage critically low'
    },

    // Engine RPM rules
    {
        parameter: 'engine_rpm',
        max: 6500,
        severity: 'HIGH',
        message: 'Engine RPM dangerously high'
    },
    {
        parameter: 'engine_rpm',
        max: 6000,
        severity: 'MEDIUM',
        message: 'Engine RPM above recommended range'
    },

    // Coolant temperature rules
    {
        parameter: 'coolant_temp',
        max: 105,
        severity: 'HIGH',
        message: 'Coolant temperature critically high'
    },
    {
        parameter: 'coolant_temp',
        max: 95,
        severity: 'MEDIUM',
        message: 'Coolant temperature above normal'
    },

    // Oil pressure rules
    {
        parameter: 'oil_pressure',
        min: 20,
        severity: 'CRITICAL',
        message: 'Oil pressure critically low - immediate attention required'
    },
    {
        parameter: 'oil_pressure',
        min: 30,
        severity: 'HIGH',
        message: 'Oil pressure low'
    },

    // Tyre pressure rules
    {
        parameter: 'tyre_pressure_fl',
        min: 28,
        max: 40,
        severity: 'MEDIUM',
        message: 'Front left tyre pressure abnormal'
    },
    {
        parameter: 'tyre_pressure_fr',
        min: 28,
        max: 40,
        severity: 'MEDIUM',
        message: 'Front right tyre pressure abnormal'
    },
    {
        parameter: 'tyre_pressure_rl',
        min: 28,
        max: 40,
        severity: 'MEDIUM',
        message: 'Rear left tyre pressure abnormal'
    },
    {
        parameter: 'tyre_pressure_rr',
        min: 28,
        max: 40,
        severity: 'MEDIUM',
        message: 'Rear right tyre pressure abnormal'
    },

    // Fuel level rules
    {
        parameter: 'fuel_level',
        min: 10,
        severity: 'LOW',
        message: 'Fuel level low'
    },
    {
        parameter: 'fuel_level',
        min: 5,
        severity: 'MEDIUM',
        message: 'Fuel level critically low'
    },

    // Transmission temperature rules
    {
        parameter: 'transmission_temp',
        max: 100,
        severity: 'HIGH',
        message: 'Transmission temperature critically high'
    },
    {
        parameter: 'transmission_temp',
        max: 90,
        severity: 'MEDIUM',
        message: 'Transmission temperature above normal'
    },
];

/**
 * Detect rule violations in sensor data
 */
export function detectRuleViolations(sensorData: SensorReading): RuleDetectionResult {
    const violations: RuleViolation[] = [];

    for (const rule of RULES) {
        const value = sensorData[rule.parameter];

        // Skip if value is not present
        if (value === undefined || value === null) {
            continue;
        }

        const numValue = Number(value);
        let violated = false;
        let threshold = 0;

        // Check minimum threshold
        if (rule.min !== undefined && numValue < rule.min) {
            violated = true;
            threshold = rule.min;
        }

        // Check maximum threshold
        if (rule.max !== undefined && numValue > rule.max) {
            violated = true;
            threshold = rule.max;
        }

        if (violated) {
            violations.push({
                rule_name: `${rule.parameter}_threshold`,
                parameter: rule.parameter,
                current_value: numValue,
                threshold: threshold,
                severity: rule.severity,
                message: rule.message
            });
        }
    }

    // Determine highest severity
    const severityOrder: AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    let highestSeverity: AlertSeverity | null = null;

    for (const violation of violations) {
        if (!highestSeverity || severityOrder.indexOf(violation.severity) > severityOrder.indexOf(highestSeverity)) {
            highestSeverity = violation.severity;
        }
    }

    return {
        violations,
        has_violations: violations.length > 0,
        highest_severity: highestSeverity
    };
}

/**
 * Format violations for AI diagnosis
 */
export function formatViolationsForAI(violations: RuleViolation[]): string {
    if (violations.length === 0) {
        return 'No rule violations detected.';
    }

    return violations.map(v =>
        `- ${v.message}: ${v.parameter} = ${v.current_value} (threshold: ${v.threshold}, severity: ${v.severity})`
    ).join('\n');
}

/**
 * Get recommended action based on severity
 */
export function getRecommendedAction(severity: AlertSeverity): string {
    switch (severity) {
        case 'CRITICAL':
            return 'IMMEDIATE ACTION REQUIRED - Stop vehicle safely and call for assistance';
        case 'HIGH':
            return 'Schedule service appointment within 24-48 hours';
        case 'MEDIUM':
            return 'Schedule service appointment within 7 days';
        case 'LOW':
            return 'Monitor condition and schedule service at next convenient time';
        default:
            return 'Continue normal operation';
    }
}
