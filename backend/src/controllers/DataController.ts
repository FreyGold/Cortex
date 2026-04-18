import type { Request, Response } from "express";
import { DataService } from "../services/DataService";
import { DataRepository } from "../repositories/DataRepository";
import { getSupabaseUserClient, getSupabaseAnonClient } from "../lib/supabase-admin";

function getService(req: Request, useAnon = false) {
  const supabase = useAnon ? getSupabaseAnonClient() : getSupabaseUserClient(req.user!.accessToken!);
  const repo = new DataRepository(supabase);
  return new DataService(repo);
}

export class DataController {
  static async getCatalog(req: Request, res: Response) {
    try {
      const service = getService(req, true);
      const data = await service.getCatalog();
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getCourseDetail(req: Request, res: Response) {
    try {
      const service = getService(req, true);
      const data = await service.getCourseDetail(req.params.courseId as string);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createDoctor(req: Request, res: Response) {
    try {
      const service = getService(req);
      const data = await service.createDoctor(req.body.name_en);
      return res.status(201).json({ doctor: data });
    } catch (error: any) {
      return res.status(error.message.includes("required") ? 400 : 500).json({ error: error.message });
    }
  }

  static async createCourse(req: Request, res: Response) {
    try {
      const service = getService(req);
      const data = await service.createCourse(req.body);
      return res.status(201).json({ course: data });
    } catch (error: any) {
      return res.status(error.message.includes("required") ? 400 : 500).json({ error: error.message });
    }
  }

  static async updateCourse(req: Request, res: Response) {
    try {
      const service = getService(req);
      const data = await service.updateCourse(req.params.id as string, req.body);
      return res.status(200).json({ course: data });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createResource(req: Request, res: Response) {
    try {
      const service = getService(req);
      const data = await service.createResource(req.params.courseId as string, req.user!.id, req.body);
      return res.status(201).json({ resource: data });
    } catch (error: any) {
      return res.status(error.message.includes("required") ? 400 : 500).json({ error: error.message });
    }
  }

  static async updateResource(req: Request, res: Response) {
    try {
      const service = getService(req);
      const data = await service.updateResource(req.params.id as string, req.body);
      return res.status(200).json({ resource: data });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteResource(req: Request, res: Response) {
    try {
      const service = getService(req);
      await service.deleteResource(req.params.id as string);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
