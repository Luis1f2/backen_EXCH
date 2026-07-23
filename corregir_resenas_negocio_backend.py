
#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()

def fail(msg):
    print("ERROR:", msg)
    sys.exit(1)

if not (ROOT / "src" / "review").exists():
    fail("Ejecuta este script desde ~/Documentos/Proyecto_integrador/API")

def backup(path):
    if path.exists():
        b = path.with_suffix(path.suffix + ".bak-review-business")
        if not b.exists():
            shutil.copy2(path, b)

controller = ROOT / "src/review/infrastructure/controller/ListMyBusinessReviewsController.ts"
controller.parent.mkdir(parents=True, exist_ok=True)
backup(controller)
controller.write_text(r'''import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type {
  Pool,
} from "pg";

import type {
  AuthenticatedRequest,
} from "../../../http/middlewares/AuthenticatedRequest.js";

interface BusinessReviewRow {
  id: string;
  user_id: string;
  business_id: string;
  business_name: string;
  rating: number;
  comment: string | null;
  created_at: Date;
}

export class ListMyBusinessReviewsController {
  constructor(
    private readonly pool: Pool,
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId =
        (request as AuthenticatedRequest)
          .userId;

      const { rows } =
        await this.pool.query<BusinessReviewRow>(
          `
          SELECT
            rn.id,
            rn.usuario_id AS user_id,
            rn.negocio_id AS business_id,
            n.nombre AS business_name,
            rn.calificacion AS rating,
            rn.comentario AS comment,
            rn.fecha AS created_at
          FROM resena_negocio rn
          INNER JOIN negocio_turistico n
            ON n.id = rn.negocio_id
          INNER JOIN negocio_administrador na
            ON na.negocio_id = rn.negocio_id
          WHERE na.usuario_id = $1
            AND na.activo = true
            AND n.activo = true
          ORDER BY rn.fecha DESC
          `,
          [userId],
        );

      response.status(200).json({
        success: true,
        data: rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          businessId: row.business_id,
          businessName: row.business_name,
          rating: Number(row.rating),
          comment: row.comment,
          createdAt: row.created_at,
        })),
      });
    } catch (error) {
      next(error);
    }
  };
}
''', encoding="utf-8")
print("[OK] ListMyBusinessReviewsController.ts")

routes = ROOT / "src/review/infrastructure/routes/reviewRoutes.ts"
if not routes.exists():
    fail("No se encontró reviewRoutes.ts")
backup(routes)
text = routes.read_text(encoding="utf-8-sig")

if "ListMyBusinessReviewsController" not in text:
    text = text.replace(
        'import type { DeleteReviewController } from "../controller/DeleteReviewController.js";',
        'import type { DeleteReviewController } from "../controller/DeleteReviewController.js";\n'
        'import type { ListMyBusinessReviewsController } from "../controller/ListMyBusinessReviewsController.js";'
    )

if "businessMine:" not in text:
    text = text.replace(
        "  delete: DeleteReviewController;\n}",
        "  delete: DeleteReviewController;\n"
        "  businessMine: ListMyBusinessReviewsController;\n}"
    )

if '"/business/mine"' not in text:
    text = text.replace(
        '  router.get("/", controllers.list.execute);\n'
        '  router.get("/:id", controllers.get.execute);',
        '  router.get("/", controllers.list.execute);\n'
        '  router.get("/business/mine", authenticate, controllers.businessMine.execute);\n'
        '  router.get("/:id", controllers.get.execute);'
    )

routes.write_text(text, encoding="utf-8")
print("[OK] reviewRoutes.ts")

deps = ROOT / "src/review/infrastructure/dependences.ts"
if not deps.exists():
    fail("No se encontró dependences.ts de review")
backup(deps)
text = deps.read_text(encoding="utf-8-sig")

if "ListMyBusinessReviewsController" not in text:
    text = text.replace(
        'import { DeleteReviewController } from "./controller/DeleteReviewController.js";',
        'import { DeleteReviewController } from "./controller/DeleteReviewController.js";\n'
        'import { ListMyBusinessReviewsController } from "./controller/ListMyBusinessReviewsController.js";'
    )

if "businessMine:" not in text:
    text = text.replace(
        "    delete: new DeleteReviewController(\n"
        "      new DeleteReview(repository)\n"
        "    )",
        "    delete: new DeleteReviewController(\n"
        "      new DeleteReview(repository)\n"
        "    ),\n"
        "    businessMine: new ListMyBusinessReviewsController(pool)"
    )

deps.write_text(text, encoding="utf-8")
print("[OK] review dependences.ts")
print("\\nEjecuta: npm run typecheck")
