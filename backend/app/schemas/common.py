from pydantic import BaseModel, ConfigDict


class APIMessage(BaseModel):
    message: str


class PaginationParams(BaseModel):
    limit: int = 20
    offset: int = 0


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
