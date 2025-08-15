import inquirer from 'inquirer';

export async function confirmPatch(newCode) {
  console.log('--- Suggested Patch ---\n');
  console.log(newCode);
  console.log('\n-----------------------');

  const { apply } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'apply',
      message: 'Apply this patch?',
      default: true
    }
  ]);

  return apply;
}
