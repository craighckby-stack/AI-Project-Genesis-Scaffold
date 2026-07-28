export interface IEvolutionRegistry {
    readonly version: string;
    readonly active: boolean;
    readonly lastUpdate: number;
}

export const Registry: IEvolutionRegistry = {
    version: '3.0.0',
    active: true,
    lastUpdate: Date.now()
};






