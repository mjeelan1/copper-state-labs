-- ai_calls records which course module made each call (was "week").
alter table ai_calls rename column week to module;
