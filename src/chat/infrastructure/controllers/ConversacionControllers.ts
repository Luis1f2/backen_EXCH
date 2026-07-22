import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { z } from "zod";

import type {
  AuthenticatedRequest,
} from "../../../http/middlewares/AuthenticatedRequest.js";

import type {
  CrearConversacion,
} from "../../application/usecase/CrearConversacion.js";

import type {
  ListarConversaciones,
} from "../../application/usecase/ListarConversaciones.js";

import type {
  ObtenerConversacion,
} from "../../application/usecase/ObtenerConversacion.js";

import type {
  AgregarMensaje,
} from "../../application/usecase/AgregarMensaje.js";

import type {
  ChatRepository,
} from "../../domain/repositories/ChatRepository.js";

import {
  AppError,
} from "../../../user/application/errors/AppError.js";

const conversationParamsSchema =
  z.object({
    id: z.string().uuid(),
  });

const createConversationSchema =
  z.object({
    titulo:
      z.string()
        .max(200)
        .optional(),
  });

const addMessageSchema =
  z.object({
    contenido:
      z.string()
        .trim()
        .min(1)
        .max(5000),
  }).strict();

export class CrearConversacionController {
  constructor(
    private readonly uc:
      CrearConversacion
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const {
        titulo,
      } =
        createConversationSchema.parse(
          request.body
        );

      const conversation =
        await this.uc.execute(
          userId,
          titulo
        );

      response
        .status(201)
        .json({
          success: true,
          data: conversation,
        });
    } catch (error) {
      next(error);
    }
  };
}

export class ListarConversacionesController {
  constructor(
    private readonly uc:
      ListarConversaciones
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const conversations =
        await this.uc.execute(
          userId
        );

      response.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  };
}

export class ObtenerConversacionController {
  constructor(
    private readonly uc:
      ObtenerConversacion
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const {
        id,
      } =
        conversationParamsSchema.parse(
          request.params
        );

      const conversation =
        await this.uc.execute(
          id,
          userId
        );

      if (!conversation) {
        throw new AppError(
          "Conversación no encontrada",
          404
        );
      }

      response.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };
}

export class AgregarMensajeController {
  constructor(
    private readonly uc:
      AgregarMensaje
  ) {}

 execute = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId =
      (
        request as
          AuthenticatedRequest
      ).userId;

    const {
      id,
    } =
      conversationParamsSchema.parse(
        request.params,
      );

    const {
      contenido,
    } =
      addMessageSchema.parse(
        request.body,
      );

    const message =
      await this.uc.execute(
        id,
        userId,
        contenido,
      );

    response
      .status(201)
      .json({
        success: true,
        data: message,
      });
  } catch (error) {
    next(error);
  }
};
}

export class EliminarConversacionController {
  constructor(
    private readonly repo:
      ChatRepository
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const {
        id,
      } =
        conversationParamsSchema.parse(
          request.params
        );

      const deleted =
        await this.repo
          .eliminarConversacion(
            id,
            userId
          );

      if (!deleted) {
        throw new AppError(
          "Conversación no encontrada",
          404
        );
      }

      response.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  };
}