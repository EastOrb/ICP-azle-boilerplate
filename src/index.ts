import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4, validate as validateUUID } from 'uuid';

type Task = Record<{
    id: string;
    title: string;
    body: string;
    status: boolean;
    createdAt: nat64;
}>

type TaskPayload = Record<{
    title: string;
    body: string;
    status: boolean;
}>

const taskStorage = new StableBTreeMap<string, Task>(0, 44, 1024);

$query;
export function getTasks(): Result<Vec<Task>, string> {
    return Result.Ok(taskStorage.values());
}

$query;
export function getTask(id: string): Result<Task, string> {
    if (!validateUUID(id)) {
        return Result.Err<Task, string>(`Invalid UUID: ${id}`);
    }
    
    const task = taskStorage.get(id);
    if (task) {
        return Result.Ok(task);
    } else {
        return Result.Err<Task, string>(`A task with id=${id} not found`);
    }
}

$update;
export function addTask(payload: TaskPayload): Result<Task, string> {
    const task: Task = { id: uuidv4(), createdAt: ic.time(), ...payload };
    taskStorage.insert(task.id, task);
    return Result.Ok(task);
}

$update;
export function updateTask(id: string, payload: TaskPayload): Result<Task, string> {
    if (!validateUUID(id)) {
        return Result.Err<Task, string>(`Invalid UUID: ${id}`);
    }
    
    const existingTask = taskStorage.get(id);
    if (!existingTask) {
        return Result.Err<Task, string>(`Couldn't update a task with id=${id}. Task not found`);
    }
    
    const updatedTask: Task = { ...existingTask, ...payload };
    taskStorage.insert(id, updatedTask);
    return Result.Ok(updatedTask);
}

$update;
export function deleteTask(id: string): Result<Task, string> {
    if (!validateUUID(id)) {
        return Result.Err<Task, string>(`Invalid UUID: ${id}`);
    }
    
    const deletedTask = taskStorage.remove(id);
    if (deletedTask) {
        return Result.Ok(deletedTask);
    } else {
        return Result.Err<Task, string>(`Couldn't delete a task with id=${id}. Task not found`);
    }
}
