import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Task = Record<{
    id: string;
    title: string;
    body: string;
    completed: boolean;
    createdAt: nat64;
}>;

type TaskPayload = Record<{
    title: string;
    body: string;
    completed: boolean;
}>;

const taskStorage = new StableBTreeMap<string, Task>(0, 44, 1024);

$query;
export function getTasks(): Result<Vec<Task>, string> {
    return Result.Ok(taskStorage.values());
}

$query;
export function getTask(id: string): Result<Task, string> {
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
    const task = taskStorage.get(id);
    if (task) {
        const updatedTask: Task = { ...task, ...payload };
        taskStorage.insert(task.id, updatedTask);
        return Result.Ok(updatedTask);
    } else {
        return Result.Err<Task, string>(`Couldn't update a task with id=${id}. Task not found`);
    }
}

$update;
export function deleteTask(id: string): Result<Task, string> {
    const deletedTask = taskStorage.remove(id);
    if (deletedTask) {
        return Result.Ok(deletedTask);
    } else {
        return Result.Err<Task, string>(`Couldn't delete a task with id=${id}. Task not found.`);
    }
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};
