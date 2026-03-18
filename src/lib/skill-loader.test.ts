/**
 * Integration Test: Dynamic Skill Loading
 *
 * This test verifies that the skill loader can:
 * 1. Read .atl/skill-registry.md from the project root
 * 2. Parse the markdown table correctly
 * 3. Resolve skill paths from the registry
 * 4. Handle path normalization (backslashes → forward slashes, tilde expansion)
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";

// Mock skill loader (copy of the one in ~/.config/opencode/tools/skill.ts)
interface SkillEntry {
  trigger: string;
  skill: string;
  path: string;
}

function parseSkillRegistry(registryPath: string): SkillEntry[] {
  const content = fs.readFileSync(registryPath, "utf-8");
  const lines = content.split("\n");
  const skills: SkillEntry[] = [];

  // Find the table start (after "| Trigger | Skill | Path |")
  let tableStartIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("| Trigger |") && lines[i].includes("| Skill |")) {
      tableStartIdx = i + 1; // Skip separator line
      break;
    }
  }

  if (tableStartIdx === -1) {
    throw new Error("Skill registry table not found");
  }

  // Parse table rows
  for (let i = tableStartIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|") || line === "|---|---|---|") continue;
    if (!line.trim()) break; // End of table

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c);
    if (cells.length >= 3) {
      skills.push({
        trigger: cells[0],
        skill: cells[1],
        path: cells[2],
      });
    }
  }

  return skills;
}

function normalizePath(skillPath: string): string {
  // Convert backslashes to forward slashes FIRST (pure string manipulation)
  let normalized = skillPath.replace(/\\/g, "/");

  // Expand tilde to home directory
  if (normalized.startsWith("~")) {
    const homeDir = homedir().replace(/\\/g, "/");
    normalized = normalized.replace("~", homeDir);
  }

  // Handle .config paths (prepend home directory)
  if (normalized.startsWith(".config")) {
    const homeDir = homedir().replace(/\\/g, "/");
    normalized = `${homeDir}/${normalized}`;
  }

  return normalized;
}

function resolveSkill(skillName: string, registryPath: string): string | null {
  const skills = parseSkillRegistry(registryPath);

  // Exact match by skill name
  let match = skills.find((s) => s.skill === skillName);
  if (match) return normalizePath(match.path);

  // Partial match (case-insensitive)
  match = skills.find((s) =>
    s.skill.toLowerCase().includes(skillName.toLowerCase()),
  );
  if (match) return normalizePath(match.path);

  // Trigger match
  match = skills.find((s) =>
    s.trigger.toLowerCase().includes(skillName.toLowerCase()),
  );
  if (match) return normalizePath(match.path);

  return null;
}

describe("Skill Loader Integration", () => {
  let registryPath: string;

  beforeAll(() => {
    // Try to find skill registry in order of precedence:
    // 1. Project .atl/skill-registry.md
    // 2. Global ~/.atl/skill-registry.md
    const projectRegistry = path.join(
      process.cwd(),
      ".atl",
      "skill-registry.md",
    );
    const globalRegistry = path.join(homedir(), ".atl", "skill-registry.md");

    if (fs.existsSync(projectRegistry)) {
      registryPath = projectRegistry;
    } else if (fs.existsSync(globalRegistry)) {
      registryPath = globalRegistry;
    } else {
      throw new Error(
        `Skill registry not found at ${projectRegistry} or ${globalRegistry}`,
      );
    }
  });

  it("should find global skill registry", () => {
    expect(fs.existsSync(registryPath)).toBe(true);
  });

  it("should parse skill registry markdown table", () => {
    const skills = parseSkillRegistry(registryPath);
    expect(skills.length).toBeGreaterThan(0);
    expect(skills[0]).toHaveProperty("trigger");
    expect(skills[0]).toHaveProperty("skill");
    expect(skills[0]).toHaveProperty("path");
  });

  it("should resolve web-requirements-analyst skill", () => {
    const skillPath = resolveSkill("web-requirements-analyst", registryPath);
    expect(skillPath).not.toBeNull();
    expect(skillPath).toContain("web-requirements-analyst");
  });

  it("should resolve react-19 skill", () => {
    const skillPath = resolveSkill("react-19", registryPath);
    expect(skillPath).not.toBeNull();
    expect(skillPath).toContain("react-19");
  });

  it("should normalize backslash paths to forward slashes", () => {
    const input = ".config\\opencode\\skills\\zustand-5\\SKILL.md";
    const normalized = normalizePath(input);
    expect(normalized).not.toContain("\\");
    expect(normalized).toContain("/");
  });

  it("should expand tilde in paths", () => {
    const input = "~/.config/opencode/skills/zustand-5/SKILL.md";
    const normalized = normalizePath(input);
    // Check that home directory path is in result (compare normalized form)
    const normalizedHome = homedir().replace(/\\/g, "/");
    expect(normalized).toContain(normalizedHome);
    expect(normalized).not.toContain("~");
  });

  it("should handle .config relative paths", () => {
    const input = ".config/opencode/skills/angular-core/SKILL.md";
    const normalized = normalizePath(input);
    // Check that home directory path is in result (compare normalized form)
    const normalizedHome = homedir().replace(/\\/g, "/");
    expect(normalized).toContain(normalizedHome);
  });

  it("should find skill by partial name match", () => {
    const skillPath = resolveSkill("requirements", registryPath);
    expect(skillPath).not.toBeNull();
    expect(skillPath).toContain("web-requirements-analyst");
  });

  it("should find skill by trigger keyword", () => {
    // "When building AI chat features" should match ai-sdk-5
    const skillPath = resolveSkill("ai chat", registryPath);
    expect(skillPath).not.toBeNull();
  });

  it("should list all available skills", () => {
    const skills = parseSkillRegistry(registryPath);
    const skillNames = skills.map((s) => s.skill);

    // Check for key skills that should exist
    expect(skillNames).toContain("web-requirements-analyst");
    expect(skillNames).toContain("react-19");
    expect(skillNames).toContain("zustand-5");
    expect(skillNames).toContain("typescript");

    console.log(`✅ Found ${skills.length} skills in registry`);
    console.log("Sample skills:", skillNames.slice(0, 5));
  });

  it("should have valid file paths for most skills", () => {
    const skills = parseSkillRegistry(registryPath);
    let validCount = 0;
    let invalidCount = 0;

    for (const skill of skills) {
      const normalized = normalizePath(skill.path);
      if (fs.existsSync(normalized)) {
        validCount++;
      } else {
        invalidCount++;
      }
    }

    // At least 90% of skills should have valid paths
    const validRatio = validCount / (validCount + invalidCount);
    console.log(
      `✅ ${validCount}/${validCount + invalidCount} skills have valid paths (${(validRatio * 100).toFixed(1)}%)`,
    );
    expect(validRatio).toBeGreaterThan(0.9);
  });

  it("should handle missing skill gracefully", () => {
    const skillPath = resolveSkill("nonexistent-skill-xyz", registryPath);
    expect(skillPath).toBeNull();
  });
});
