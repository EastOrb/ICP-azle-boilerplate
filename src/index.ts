import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define the Task and TaskPayload types
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

// Create a StableBTreeMap to store the tasks
const taskStorage = new StableBTreeMap<string, Task>(0, 44, 1024);

// Function to get all tasks
$query;
export function getTasks(): Result<Vec<Task>, string> {
    return Result.Ok(taskStorage.values());
}

// Function to get a single task by its ID
$query;
export function getTask(id: string): Result<Task, string> {
    return match(taskStorage.get(id), {
        Some: (task) => Result.Ok<Task, string>(task),
        None: () => Result.Err<Task, string>(`a task with id=${id} not found`)
    });
}

// Function to add a new task
$update;
export function addTask(payload: TaskPayload): Result<Task, string> {
    const task: Task = { id: uuidv4(), createdAt: ic.time(), ...payload };
    taskStorage.insert(task.id, task);
    return Result.Ok(task);
}

// Function to update an existing task by its ID
$update;
export function updateTask(id: string, payload: TaskPayload): Result<Task, string> {
    const existingTask = taskStorage.get(id);
    if (existingTask) {
        // Merge the existing task with the updated fields from the payload
        const updatedTask: Task = { ...existingTask, ...payload };
        // Update the task in the taskStorage map
        taskStorage.set(id, updatedTask);
        return Result.Ok(updatedTask);
    } else {
        return Result.Err<Task, string>(`couldn't update a task with id=${id}. task not found`);
    }
}

// Function to delete a task by its ID
$update;
export function deleteTask(id: string): Result<Task, string> {
    const existingTask = taskStorage.get(id);
    if (existingTask) {
        // Remove the task from the taskStorage map
        taskStorage.remove(id);
        return Result.Ok(existingTask);
    } else {
        return Result.Err<Task, string>(`couldn't delete a task with id=${id}. task not found.`);
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
