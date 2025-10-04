import { prisma } from "../lib/database";
import * as fs from "fs";
import * as path from "path";

interface SchemaValidationResult {
  schemaName: string;
  hasServerRoutes: boolean;
  hasClientRoutes: boolean;
  hasAPIIntegration: boolean;
  hasCRUDOperations: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  issues: string[];
  implementationStatus: "full" | "partial" | "none";
}

export class SchemaValidator {
  private static serverRoutesPath = path.join(__dirname, "../routes");
  private static clientRoutesPath = path.join(__dirname, "../../../client/app");
  private static clientServicesPath = path.join(
    __dirname,
    "../../../client/src/services"
  );

  static async validateAllSchemas(): Promise<SchemaValidationResult[]> {
    console.log("🔍 Starting comprehensive schema validation...");

    const schemas = this.extractSchemasFromPrisma();
    const results: SchemaValidationResult[] = [];

    for (const schemaName of schemas) {
      const result = await this.validateSchema(schemaName);
      results.push(result);
    }

    this.printDetailedReport(results);
    return results;
  }

  private static extractSchemasFromPrisma(): string[] {
    const schemaPath = path.join(__dirname, "../../prisma/schema.prisma");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    const modelRegex = /model\s+(\w+)\s+{/g;
    const schemas: string[] = [];
    let match;

    while ((match = modelRegex.exec(schemaContent)) !== null) {
      schemas.push(match[1]);
    }

    return schemas;
  }

  private static async validateSchema(
    schemaName: string
  ): Promise<SchemaValidationResult> {
    const result: SchemaValidationResult = {
      schemaName,
      hasServerRoutes: false,
      hasClientRoutes: false,
      hasAPIIntegration: false,
      hasCRUDOperations: {
        create: false,
        read: false,
        update: false,
        delete: false,
      },
      issues: [],
      implementationStatus: "none",
    };

    // Check server routes
    result.hasServerRoutes = this.checkServerRoutes(schemaName);
    if (!result.hasServerRoutes) {
      result.issues.push("Missing server routes");
    }

    // Check client integration
    result.hasClientRoutes = this.checkClientRoutes(schemaName);
    if (!result.hasClientRoutes) {
      result.issues.push("Missing client routes/components");
    }

    // Check API integration
    result.hasAPIIntegration = this.checkAPIIntegration(schemaName);
    if (!result.hasAPIIntegration) {
      result.issues.push("Missing API integration");
    }

    // Check CRUD operations
    result.hasCRUDOperations = await this.checkCRUDOperations(schemaName);

    const crudCount = Object.values(result.hasCRUDOperations).filter(
      Boolean
    ).length;
    if (crudCount < 4) {
      result.issues.push(`Incomplete CRUD operations (${crudCount}/4)`);
    }

    // Determine implementation status
    const issueCount = result.issues.length;
    if (issueCount === 0) {
      result.implementationStatus = "full";
    } else if (issueCount <= 2) {
      result.implementationStatus = "partial";
    } else {
      result.implementationStatus = "none";
    }

    return result;
  }

  private static checkServerRoutes(schemaName: string): boolean {
    if (!fs.existsSync(this.serverRoutesPath)) return false;

    const routeFiles = fs.readdirSync(this.serverRoutesPath, {
      recursive: true,
    });
    const lowerSchemaName = schemaName.toLowerCase();

    return routeFiles.some((file) => {
      const fileName = String(file).toLowerCase().replace(".ts", "");
      return (
        fileName.includes(lowerSchemaName) || lowerSchemaName.includes(fileName)
      );
    });
  }

  private static checkClientRoutes(schemaName: string): boolean {
    if (!fs.existsSync(this.clientRoutesPath)) return false;

    const findInDirectory = (dir: string, searchTerm: string): boolean => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            if (findInDirectory(fullPath, searchTerm)) return true;
          } else if (
            item.toLowerCase().includes(searchTerm) ||
            searchTerm.includes(item.toLowerCase().replace(".tsx", ""))
          ) {
            return true;
          }
        }
      } catch (error) {
        return false;
      }

      return false;
    };

    return findInDirectory(this.clientRoutesPath, schemaName.toLowerCase());
  }

  private static checkAPIIntegration(schemaName: string): boolean {
    if (!fs.existsSync(this.clientServicesPath)) return false;

    const apiFile = path.join(this.clientServicesPath, "api.ts");
    if (!fs.existsSync(apiFile)) return false;

    const apiContent = fs.readFileSync(apiFile, "utf-8");
    const lowerSchemaName = schemaName.toLowerCase();

    return apiContent.toLowerCase().includes(lowerSchemaName);
  }

  private static async checkCRUDOperations(schemaName: string): Promise<{
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  }> {
    const modelName = schemaName.charAt(0).toLowerCase() + schemaName.slice(1);

    try {
      // @ts-ignore
      const model = prisma[modelName];

      return {
        create: typeof model?.create === "function",
        read: typeof model?.findMany === "function",
        update: typeof model?.update === "function",
        delete: typeof model?.delete === "function",
      };
    } catch (error) {
      return {
        create: false,
        read: false,
        update: false,
        delete: false,
      };
    }
  }

  private static printDetailedReport(results: SchemaValidationResult[]): void {
    console.log("\n📊 === COMPREHENSIVE SCHEMA VALIDATION REPORT ===\n");

    const fullImpl = results.filter((r) => r.implementationStatus === "full");
    const partialImpl = results.filter(
      (r) => r.implementationStatus === "partial"
    );
    const noImpl = results.filter((r) => r.implementationStatus === "none");

    console.log(`✅ Fully Implemented: ${fullImpl.length}`);
    console.log(`⚠️  Partially Implemented: ${partialImpl.length}`);
    console.log(`❌ Not Implemented: ${noImpl.length}\n`);

    console.log("=== DETAILED RESULTS ===\n");

    for (const result of results) {
      const statusIcon =
        result.implementationStatus === "full"
          ? "✅"
          : result.implementationStatus === "partial"
          ? "⚠️"
          : "❌";

      console.log(`${statusIcon} ${result.schemaName}`);
      console.log(`   Server Routes: ${result.hasServerRoutes ? "✅" : "❌"}`);
      console.log(`   Client Routes: ${result.hasClientRoutes ? "✅" : "❌"}`);
      console.log(
        `   API Integration: ${result.hasAPIIntegration ? "✅" : "❌"}`
      );
      console.log(
        `   CRUD: C:${result.hasCRUDOperations.create ? "✅" : "❌"} R:${
          result.hasCRUDOperations.read ? "✅" : "❌"
        } U:${result.hasCRUDOperations.update ? "✅" : "❌"} D:${
          result.hasCRUDOperations.delete ? "✅" : "❌"
        }`
      );

      if (result.issues.length > 0) {
        console.log(`   Issues: ${result.issues.join(", ")}`);
      }
      console.log("");
    }
  }
}
