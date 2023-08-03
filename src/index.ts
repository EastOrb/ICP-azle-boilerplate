import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Task = Record<{
    id: string;
    title: string;
    body: string;
    status: boolean;
    createdAt: nat64;
}>;

type TaskPayload = Record<{
    title: string;
    body: string;
    status: boolean;
}>;

const taskStorage = new StableBTreeMap<string, Task>(0, 44, 1024);

$query;
export function getTasks(): Result<Vec<Task>, string> {
    return Result.Ok(taskStorage.values());
}

$query;
export function getTask(id: string): Result<Task, string> {
    return match(taskStorage.get(id), {
        Some: (task) => Result.Ok<Task, string>(task),
        None: () => Result.Err<Task, string>(`a task with id=${id} not found`)
    });
}

$update;
export function addTask(payload: TaskPayload): Result<Task, string> {
    const task: Task = { id: uuidv4(), createdAt: ic.time(), ...payload };
    taskStorage.insert(task.id, task);
    return Result.Ok(task);
}

$update;
export function updateTask(id: string, payload: TaskPayload): Result<Task, string> {
    return match(taskStorage.get(id), {
        Some: (task) => {
            const updatedTask: Task = { ...task, ...payload };
            taskStorage.insert(task.id, updatedTask);
            return Result.Ok<Task, string>(updatedTask);
        },
        None: () => Result.Err<Task, string>(`couldn't update a task with id=${id}. task not found`)
    });
}

$update;
export function deleteTask(id: string): Result<Task, string> {
    return match(taskStorage.remove(id), {
        Some: (deletedTask) => Result.Ok<Task, string>(deletedTask),
        None: () => Result.Err<Task, string>(`couldn't delete a task with id=${id}. task not found.`)
    });
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

// Additional Functions

// Function to mark a task as completed
$update;
export function markTaskAsCompleted(id: string): Result<Task, string> {
    return match(taskStorage.get(id), {
        Some: (task) => {
            const updatedTask: Task = { ...task, status: true };
            taskStorage.insert(task.id, updatedTask);
            return Result.Ok<Task, string>(updatedTask);
        },
        None: () => Result.Err<Task, string>(`couldn't mark task with id=${id} as completed. task not found`)
    });
}

// Function to filter tasks by status (completed or pending)
$query;
export function getTasksByStatus(status: boolean): Result<Vec<Task>, string> {
    const filteredTasks = taskStorage.values().filter(task => task.status === status);
    return Result.Ok(filteredTasks);
}

// Function to search tasks by keyword in title or body
$query;
export function searchTasksByKeyword(keyword: string): Result<Vec<Task>, string> {
    const filteredTasks = taskStorage.values().filter(task => task.title.includes(keyword) || task.body.includes(keyword));
    return Result.Ok(filteredTasks);
}

// Function to get tasks created within a specific time range
$query;
export function getTasksByTimeRange(startTime: nat64, endTime: nat64): Result<Vec<Task>, string> {
    const filteredTasks = taskStorage.values().filter(task => task.createdAt >= startTime && task.createdAt <= endTime);
    return Result.Ok(filteredTasks);
}

// Function to get the total number of tasks
$query;
export function getTotalTasksCount(): Result<number, string> {
    return Result.Ok(taskStorage.size());
}

// Function to clear all completed tasks
$update;
export function clearCompletedTasks(): Result<void, string> {
    const completedTasks = taskStorage.values().filter(task => task.status === true);
    completedTasks.forEach(task => taskStorage.remove(task.id));
    return Result.Ok();
}

// Function to sort tasks by creation date or status
$query;
export function sortTasks(sortBy: 'date' | 'status'): Result<Vec<Task>, string> {
    const sortedTasks = taskStorage.values().sort((a, b) => {
        if (sortBy === 'date') {
            return a.createdAt - b.createdAt;
        } else if (sortBy === 'status') {
            return a.status === b.status ? 0 : a.status ? -1 : 1;
        }
    });
    return Result.Ok(sortedTasks);
}
